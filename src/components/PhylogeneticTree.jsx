import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { Button, Space } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import PropTypes from 'prop-types'

// 移到组件外部作为工具函数
const normalizeId = (id) => id?.replace(/-/g, '_')

const PhylogeneticTree = ({ selectedSamples, tableData }) => {
  const svgRef = useRef(null)
  const width = 1950
  const outerRadius = width / 2
  const innerRadius = outerRadius - 260

  // 解析 Newick 格式
  const parseNewick = (newick) => {
    const tokens = newick.split(/\s*(;|\(|\)|,|:)\s*/).filter(token => token.length > 0)
    let pos = 0
    
    const buildTree = () => {
      let node = {}
      
      while (pos < tokens.length) {
        const token = tokens[pos]
        switch (token) {
          case '(':
            pos++
            node.branchset = []
            while (true) {
              node.branchset.push(buildTree())
              if (tokens[pos] === ',') {
                pos++
                continue
              }
              if (tokens[pos] === ')') {
                pos++
                break
              }
            }
            break
          case ',':
          case ')':
          case ';':
            return node
          case ':':
            pos++
            node.length = parseFloat(tokens[pos])
            pos++
            break
          default:
            if (token !== '') {
              node.name = token
            }
            pos++
        }
      }
      return node
    }

    return buildTree()
  }

  // 过滤树节点
  const filterTree = useCallback((node, selectedIds) => {
    if (!node) return null
    
    if (!node.branchset) {
      return (!selectedIds.size || selectedIds.has(normalizeId(node.name))) ? node : null
    }

    const filteredChildren = node.branchset
      .map(child => filterTree(child, selectedIds))
      .filter(Boolean)

    if (filteredChildren.length === 0) return null

    return {
      ...node,
      branchset: filteredChildren
    }
  }, [])

  const drawTree = useCallback(async () => {
    try {
      // 清除旧的SVG内容
      d3.select(svgRef.current).selectAll('*').remove()

      // 加载数据
      const response = await fetch('/treebest_NJ.treeout.newick')
      const text = await response.text()
      const data = parseNewick(text)

      // 过滤树
      const selectedIds = new Set(selectedSamples || [])
      const filteredData = selectedIds.size > 0 ? filterTree(data, selectedIds) : data

      // 如果过滤后没有数据，显示提示信息
      if (!filteredData) {
        const svg = d3.select(svgRef.current)
          .attr('viewBox', [-outerRadius, -outerRadius, width, width])
        
        svg.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .text('No matching nodes found')
        
        return
      }

      // 创建层次结构
      const root = d3.hierarchy(filteredData, d => d.branchset)
        .sum(d => d.branchset ? 0 : 1)
        .sort((a, b) => (a.value - b.value) || d3.ascending(a.data.length, b.data.length))

      // 创建布局
      const cluster = d3.cluster()
        .size([360, innerRadius])
        .separation(() => 1)

      cluster(root)

      // 设置半径
      const setRadius = (d, y0, k) => {
        d.radius = (y0 += d.data.length || 0) * k
        if (d.children) d.children.forEach(child => setRadius(child, y0, k))
      }

      setRadius(root, root.data.length = 0, innerRadius / root.height)

      // 创建SVG
      const svg = d3.select(svgRef.current)
        .attr('viewBox', [-outerRadius, -outerRadius, width, width])
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)

      // 添加连线
      const linkStep = (startAngle, startRadius, endAngle, endRadius) => {
        const c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI)
        const s0 = Math.sin(startAngle)
        const c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI)
        const s1 = Math.sin(endAngle)
        return `M${startRadius * c0},${startRadius * s0}
                ${endAngle === startAngle ? '' : `A${startRadius},${startRadius} 0 0 ${endAngle > startAngle ? 1 : 0} ${startRadius * c1},${startRadius * s1}`}
                L${endRadius * c1},${endRadius * s1}`
      }

      const linkConstant = d => linkStep(d.source.x, d.source.y, d.target.x, d.target.y)

      // 绘制分支
      const links = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-opacity', 1)
        .attr('stroke-width', 1.65)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', linkConstant)  // 只使用固定长度的连线

      // 添加节点，使用黑色
      const nodes = svg.append('g')
        .selectAll('circle')
        .data(root.descendants())
        .join('circle')
        .attr('transform', d => `
          rotate(${d.x - 90})
          translate(${d.y},0)
        `)
        .attr('fill', '#000')  // 统一使用黑色
        .attr('r', 0.5)

      // 添加标签
      const labels = svg.append('g')
        .selectAll('text')
        .data(root.leaves())
        .join('text')
        .attr('dy', '.31em')
        .attr('transform', d => `
          rotate(${d.x - 90})
          translate(${d.y + 4},0)
          ${d.x < 180 ? '' : 'rotate(180)'}
        `)
        .attr('text-anchor', d => d.x < 180 ? 'start' : 'end')
        .text(d => d.data.name)
        .style('font-size', '8px')
        .style('font-family', 'sans-serif')
        .style('fill', '#333')

      // 修改高亮效果
      const highlight = (d) => {
        const ancestors = d.ancestors()
        const ancestorIds = new Set(ancestors.map(d => d.data.name))

        links
          .attr('stroke-opacity', l => 
            ancestorIds.has(l.source.data.name) && ancestorIds.has(l.target.data.name) ? 1 : 0.2
          )
          .attr('stroke-width', l => 
            ancestorIds.has(l.source.data.name) && ancestorIds.has(l.target.data.name) ? 2 : 1.65
          )
          .attr('stroke', l => 
            ancestorIds.has(l.source.data.name) && ancestorIds.has(l.target.data.name) 
              ? '#000' 
              : '#ddd'
          )

        nodes
          .attr('fill', n => ancestorIds.has(n.data.name) ? '#000' : '#ccc')
          .attr('r', n => ancestorIds.has(n.data.name) ? 1 : 0.5)

        labels
          .attr('font-weight', n => ancestorIds.has(n.data.name) ? 'bold' : 'normal')
          .style('font-size', n => ancestorIds.has(n.data.name) ? '9px' : '8px')
      }

      const unhighlight = () => {
        links
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 1.65)
          .attr('stroke', '#000')
        nodes
          .attr('fill', '#000')
          .attr('r', 0.5)
        labels
          .attr('font-weight', 'normal')
          .style('font-size', '8px')
      }

      // 创建 tooltip div
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tree-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', 1000)

      // 格式化分支长度
      const formatBranchLength = (length) => {
        if (length === undefined) return 'N/A'
        return length.toFixed(6)
      }

      // 获取节点信息
      const getNodeInfo = (d) => {
        const info = []
        if (d.data.name) {
          info.push(`名称: ${d.data.name}`)
          // 如果有对应的表格数据，显示更多信息
          const tableRow = tableData?.find(item => normalizeId(item.分析样本名) === normalizeId(d.data.name))
          if (tableRow) {
            info.push(`实际样本名: ${tableRow.实际样本名}`)
            info.push(`品种名: ${tableRow.品种名}`)
            info.push(`分类: ${tableRow.分类}`)
          }
        }
        info.push(`分支长度: ${formatBranchLength(d.data.length)}`)
        if (d.children) {
          info.push(`子节点数: ${d.children.length}`)
        } else {
          info.push('类型: 叶节点')
        }
        return info.join('<br/>')
      }

      // 显示 tooltip
      const showTooltip = (event, d) => {
        tooltip
          .style('visibility', 'visible')
          .html(getNodeInfo(d))
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`)
      }

      // 移动 tooltip
      const moveTooltip = (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`)
      }

      // 隐藏 tooltip
      const hideTooltip = () => {
        tooltip.style('visibility', 'hidden')
      }

      // 为节点添加 tooltip 交互
      nodes
        .on('mouseover', (event, d) => {
          highlight(d)
          showTooltip(event, d)
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', () => {
          unhighlight()
          hideTooltip()
        })

      // 为标签添加 tooltip 交互
      labels
        .on('mouseover', (event, d) => {
          highlight(d)
          showTooltip(event, d)
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', () => {
          unhighlight()
          hideTooltip()
        })

      // 组件卸载时清理 tooltip
      return () => {
        tooltip.remove()
      }

    } catch (error) {
      console.error('Error drawing tree:', error)
    }
  }, [selectedSamples, tableData, filterTree, innerRadius, outerRadius])

  useEffect(() => {
    drawTree()
  }, [drawTree])

  const handleDownload = () => {
    const svgNode = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svgNode)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'phylogenetic_tree.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="phylogenetic-tree-container">
      <div className="chart-header">
        <Space>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            title="下载图片"
          >
            下载
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => drawTree()}
            title="刷新图表"
          >
            刷新
          </Button>
        </Space>
      </div>
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 100px)',
          backgroundColor: '#fff' 
        }} 
      />
    </div>
  )
}

PhylogeneticTree.propTypes = {
  selectedSamples: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.arrayOf(PropTypes.object)
}

export default PhylogeneticTree 