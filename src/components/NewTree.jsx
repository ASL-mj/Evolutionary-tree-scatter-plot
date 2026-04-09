import { Card, Checkbox } from 'antd'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const NewTree = () => {
  const svgRef = useRef(null)
  const [showBranchLength, setShowBranchLength] = useState(true)

  useEffect(() => {
    // Load and render the tree
    const loadData = async () => {
      try {
        const response = await fetch('/life.txt')
        const text = await response.text()
        const data = parseNewick(text)
        renderTree(data, showBranchLength)
      } catch (error) {
        console.error('Error loading tree data:', error)
      }
    }

    loadData()
  }, [showBranchLength])

  // Parse Newick format - from https://github.com/jasondavies/newick.js
  const parseNewick = (a) => {
    const ancestors = []
    let tree = {}
    const tokens = a.split(/\s*(;|\(|\)|,|:)\s*/)
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      switch (token) {
        case '(': // new branchset
          const subtree = {}
          tree.branchset = [subtree]
          ancestors.push(tree)
          tree = subtree
          break
        case ',': // another branch
          const subtree2 = {}
          ancestors[ancestors.length - 1].branchset.push(subtree2)
          tree = subtree2
          break
        case ')': // optional name next
          tree = ancestors.pop()
          break
        case ':': // optional length next
          break
        default:
          const x = tokens[i - 1]
          if (x === ')' || x === '(' || x === ',') {
            tree.name = token
          } else if (x === ':') {
            tree.length = parseFloat(token)
          }
      }
    }
    return tree.branchset ? tree.branchset[0] : tree
  }

  const renderTree = (data, checked) => {
    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const width = 954
    const outerRadius = width / 2
    const innerRadius = outerRadius - 250

    // Create hierarchy
    const root = d3.hierarchy(data, d => d.branchset)
      .sum(d => d.branchset ? 0 : 1)
      .sort((a, b) => (a.value - b.value) || d3.ascending(a.data.length, b.data.length))

    // Cluster layout
    const cluster = d3.cluster()
      .size([360, innerRadius])
      .separation((a, b) => 1)

    cluster(root)
    setRadius(root, root.data.length = 0, innerRadius / maxLength(root))
    setColor(root)

    // Create SVG with zoom capability
    const svg = d3.select(svgRef.current)
      .attr('viewBox', [-outerRadius, -outerRadius, width, width])
      .attr('font-family', 'sans-serif')
      .attr('font-size', 6)

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create a group for all elements that will be zoomed
    const g = svg.append('g')

    // Add styles
    svg.append('style').text(`
      .link--active {
        stroke: #000 !important;
        stroke-width: 1.5px;
      }
      .link-extension--active {
        stroke-opacity: .6;
      }
      .label--active {
        font-weight: bold;
      }
    `)

    // Link extensions (for branch length visualization) - gray lines extending to outer radius
    const linkExtension = g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.25)
      .selectAll('path')
      .data(root.links().filter(d => !d.target.children))
      .join('path')
      .each(function(d) { d.target.linkExtensionNode = this })
      .attr('d', checked ? linkExtensionVariable : linkExtensionConstant)

    // Links - main tree branches
    const link = g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .selectAll('path')
      .data(root.links())
      .join('path')
      .each(function(d) { d.target.linkNode = this })
      .attr('d', checked ? linkVariable : linkConstant)
      .attr('stroke', d => d.target.color || '#999')

    // Labels
    const labels = g.append('g')
      .selectAll('text')
      .data(root.leaves())
      .join('text')
      .attr('dy', '.31em')
      .attr('transform', d => {
        const radius = checked ? d.radius : innerRadius
        return `rotate(${d.x - 90}) translate(${radius + 4},0)${d.x < 180 ? '' : ' rotate(180)'}`
      })
      .attr('text-anchor', d => d.x < 180 ? 'start' : 'end')
      .text(d => d.data.name ? d.data.name.replace(/_/g, ' ') : '')
      .attr('fill', d => d.color || '#000')
      .on('mouseover', mouseovered(true))
      .on('mouseout', mouseovered(false))

    // Update function for checkbox
    const update = (checked) => {
      const t = d3.transition().duration(750)
      linkExtension.transition(t).attr('d', checked ? linkExtensionVariable : linkExtensionConstant)
      link.transition(t).attr('d', checked ? linkVariable : linkConstant)
      labels.transition(t).attr('transform', d => {
        const radius = checked ? d.radius : innerRadius
        return `rotate(${d.x - 90}) translate(${radius + 4},0)${d.x < 180 ? '' : ' rotate(180)'}`
      })
    }

    // Mouseover function
    function mouseovered(active) {
      return function(event, d) {
        d3.select(this).classed('label--active', active)
        d3.select(d.linkExtensionNode).classed('link-extension--active', active).raise()
        do d3.select(d.linkNode).classed('link--active', active).raise()
        while (d = d.parent)
      }
    }

    // Store update function for checkbox handler
    svg.node().update = update
  }

  // Color scale - use more colors for better visualization
  const color = d3.scaleOrdinal(d3.schemeCategory10)

  // Compute the maximum cumulative length of any node in the tree
  function maxLength(d) {
    return d.data.length + (d.children ? d3.max(d.children, maxLength) : 0)
  }

  // Set the radius of each node by recursively summing and scaling the distance from the root
  function setRadius(d, y0, k) {
    d.radius = (y0 += d.data.length) * k
    if (d.children) d.children.forEach(d => setRadius(d, y0, k))
  }

  // Set the color of each node by assigning colors to major clades
  function setColor(d, depth = 0) {
    if (depth === 0 && d.children) {
      // Assign different colors to top-level branches
      d.children.forEach((child, i) => {
        child.color = color(i)
        if (child.children) {
          child.children.forEach(c => setColorRecursive(c, child.color))
        }
      })
    }
  }

  function setColorRecursive(d, parentColor) {
    d.color = parentColor
    if (d.children) {
      d.children.forEach(c => setColorRecursive(c, parentColor))
    }
  }

  // Link path functions
  function linkStep(startAngle, startRadius, endAngle, endRadius) {
    const c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI)
    const s0 = Math.sin(startAngle)
    const c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI)
    const s1 = Math.sin(endAngle)
    return 'M' + startRadius * c0 + ',' + startRadius * s0
      + (endAngle === startAngle ? '' : 'A' + startRadius + ',' + startRadius + ' 0 0 ' + (endAngle > startAngle ? 1 : 0) + ' ' + startRadius * c1 + ',' + startRadius * s1)
      + 'L' + endRadius * c1 + ',' + endRadius * s1
  }

  function linkConstant(d) {
    return linkStep(d.source.x, d.source.y, d.target.x, d.target.y)
  }

  function linkExtensionConstant(d) {
    return linkStep(d.target.x, d.target.y, d.target.x, d.target.radius)
  }

  function linkVariable(d) {
    return linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius)
  }

  function linkExtensionVariable(d) {
    return linkStep(d.target.x, d.target.radius, d.target.x, d.target.radius)
  }

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked
    setShowBranchLength(checked)
    
    // Call update function if it exists
    const svg = d3.select(svgRef.current)
    if (svg.node() && svg.node().update) {
      svg.node().update(checked)
    }
  }

  return (
    <div className="new-page-container" style={{ padding: '24px' }}>
      <Card 
        title="Tree of Life" 
        className="new-page-card"
        style={{ marginBottom: '16px' }}
        extra={
          <Checkbox 
            checked={showBranchLength} 
            onChange={handleCheckboxChange}
          >
            Show branch length
          </Checkbox>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
        </div>
      </Card>
    </div>
  )
}

export default NewTree
