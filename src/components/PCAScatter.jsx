import ReactECharts from 'echarts-for-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Radio, Button, Space } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import PropTypes from 'prop-types'

const PCAScatter = ({ selectedSamples, tableData }) => {
  const [pcaData, setPcaData] = useState([])
  const [currentChart, setCurrentChart] = useState('1-2')
  const chartRef = useRef(null)

  // 标准化样本名（将-转换为_）
  const normalizeId = (id) => id?.replace(/-/g, '_')

  const loadPcaData = useCallback(async () => {
    try {
      const response = await fetch('/pca.eigenvec')
      const text = await response.text()
      const rows = text.trim().split('\n')
      const data = rows.map(row => {
        const [id, name, pc1, pc2, pc3] = row.split(' ')
        return {
          id: normalizeId(id),
          name,
          pc1: parseFloat(pc1),
          pc2: parseFloat(pc2),
          pc3: parseFloat(pc3)
        }
      })
      setPcaData(data)
    } catch (error) {
      console.error('Error loading PCA data:', error)
    }
  }, [])

  useEffect(() => {
    loadPcaData()
  }, [loadPcaData])

  const chartConfigs = {
    '1-2': { xAxis: 'pc1', yAxis: 'pc2', xName: 'PC1', yName: 'PC2' },
    '1-3': { xAxis: 'pc1', yAxis: 'pc3', xName: 'PC1', yName: 'PC3' },
    '2-3': { xAxis: 'pc2', yAxis: 'pc3', xName: 'PC2', yName: 'PC3' }
  }

  const getChartOption = (xAxis, yAxis, xName, yName) => {
    const selectedData = pcaData.filter(item => 
      selectedSamples.includes(item.id)
    )

    return {
      title: {
        text: `${xName} vs ${yName} 散点图`,
        left: 'center',
        top: 10
      },
      grid: {
        top: 60,
        right: 60,
        bottom: 60,
        left: 80,
        containLabel: true,
        aspect: 1
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const tableRow = tableData.find(item => normalizeId(item.分析样本名) === params.data.id)
          return tableRow ? 
            `分析样本名: ${tableRow.分析样本名}<br/>` +
            `实际样本名: ${tableRow.实际样本名}<br/>` +
            `品种名: ${tableRow.品种名}<br/>` +
            `分类: ${tableRow.分类}<br/>` +
            `${xName}: ${params.data[xAxis].toFixed(4)}<br/>` +
            `${yName}: ${params.data[yAxis].toFixed(4)}` :
            `${params.data.name}<br/>${xName}: ${params.data[xAxis].toFixed(4)}<br/>${yName}: ${params.data[yAxis].toFixed(4)}`
        }
      },
      xAxis: {
        type: 'value',
        name: xName,
        nameGap: 25,
        nameLocation: 'middle',
        scale: true,
        axisLabel: {
          margin: 12
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: yName,
        nameGap: 45,
        nameLocation: 'middle',
        nameRotate: 90,
        scale: true,
        axisLabel: {
          margin: 15
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [{
        type: 'scatter',
        data: selectedData.map(item => ({
          name: item.name,
          id: item.id,
          value: [item[xAxis], item[yAxis]],
          [xAxis]: item[xAxis],
          [yAxis]: item[yAxis]
        })),
        itemStyle: {
          color: '#4CAF50'
        },
        symbolSize: 8
      }]
    }
  }

  const handleDownload = () => {
    const echartInstance = chartRef.current.getEchartsInstance()
    const base64 = echartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = `${chartConfigs[currentChart].xName}_vs_${chartConfigs[currentChart].yName}.png`
    link.href = base64
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="pca-scatter-wrapper" style={{ height: '100%' }}>
      <div className="chart-header">
        <Radio.Group 
          value={currentChart} 
          onChange={e => setCurrentChart(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="1-2">PCA:PC1 PC2</Radio.Button>
          <Radio.Button value="1-3">PCA:PC1 PC3</Radio.Button>
          <Radio.Button value="2-3">PCA:PC2 PC3</Radio.Button>
        </Radio.Group>
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
            onClick={() => chartRef.current?.getEchartsInstance().resize()}
            title="刷新图表"
          >
            刷新
          </Button>
        </Space>
      </div>
      <div style={{ 
        height: 'calc(100% - 60px)', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: 'calc(100vh - 160px)',
          position: 'relative' 
        }}>
          <ReactECharts 
            ref={chartRef}
            option={getChartOption(
              chartConfigs[currentChart].xAxis,
              chartConfigs[currentChart].yAxis,
              chartConfigs[currentChart].xName,
              chartConfigs[currentChart].yName
            )}
            style={{ 
              height: '100%', 
              width: '100%', 
              position: 'absolute',
              top: 0,
              left: 0
            }}
            opts={{ 
              renderer: 'svg',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  )
}

PCAScatter.propTypes = {
  selectedSamples: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.arrayOf(PropTypes.object)
}

export default PCAScatter 