import ReactECharts from 'echarts-for-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Space, Select } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import PropTypes from 'prop-types'

// 文件配置
const FILE_CONFIG = {
  k2: { path: '/k2.Q', label: 'K=2' },
  k3: { path: '/k3.Q', label: 'K=3' },
  k4: { path: '/k4.Q', label: 'K=4' },
  k5: { path: '/k5.Q', label: 'K=5' }
}

const StackedBarChart = ({ selectedSamples, tableData }) => {
  const [data, setData] = useState({
    categories: [],
    qValues: []
  })
  const [currentFile, setCurrentFile] = useState('k2')
  const chartRef = useRef(null)

  // 标准化样本名（将-转换为_）
  const normalizeId = (id) => id?.replace(/-/g, '_')

  // 使用 useCallback 包装 loadData
  const loadData = useCallback(async (fileKey) => {
    try {
      const response = await fetch(FILE_CONFIG[fileKey].path)
      const text = await response.text()
      const rows = text.trim().split('\n')
      const processedData = rows.map((row, index) => {
        const values = row.split(' ')
        const qValues = values.slice(1).map(v => parseFloat(v))
        return { 
          id: normalizeId(values[0]),
          qValues,
          index  // 保存原始顺序
        }
      })

      // 如果有选中的样本，只显示选中的样本
      const filteredData = selectedSamples?.length > 0
        ? processedData.filter(item => selectedSamples.includes(item.id))
        : processedData

      // 多群体级联排序
      filteredData.sort((a, b) => {
        for (let i = 0; i < a.qValues.length; i++) {
          if (a.qValues[i] !== b.qValues[i]) {
            return a.qValues[i] - b.qValues[i]
          }
        }
        return 0
      })

      setData({
        categories: filteredData.map(item => {
          const tableRow = tableData?.find(row => normalizeId(row.分析样本名) === item.id)
          return tableRow ? `${tableRow.分析样本名}\n${tableRow.品种名}` : item.id
        }),
        qValues: filteredData[0].qValues.map((_, index) => 
          filteredData.map(item => item.qValues[index])
        )
      })
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [selectedSamples, tableData])  // 添加依赖

  useEffect(() => {
    loadData(currentFile)
  }, [currentFile, loadData])  // 更新依赖数组

  const option = {
    title: {
      text: `群体结构分析(${FILE_CONFIG[currentFile].label})`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        return `${params[0].axisValue}<br/>` +
          params.map(item => 
            `群体${item.seriesIndex + 1}: ${(item.value * 100).toFixed(2)}%`
          ).join('<br/>')
      }
    },
    grid: {
      left: '10%',
      right: '4%',
      bottom: '25%',
      containLabel: false,
      top: 80
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        rotate: 90,
        // 设置x轴标签的显示间隔
        interval: Math.floor(data.categories?.length / 100) || 0,
        fontSize: 10,
        align: 'right',
        verticalAlign: 'top',
        margin: 8,
        rich: {
          value: {
            align: 'right',
            padding: [0, 0, 0, 0]
          }
        }
      },
      position: 'bottom',
      axisTick: {
        alignWithLabel: true,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '比例',
      max: 1,
      axisLabel: {
        formatter: value => `${(value * 100).toFixed(0)}%`
      }
    },
    series: data.qValues?.map((values, index) => ({
      name: `群体${index + 1}`,
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series'
      },
      data: values,
      itemStyle: {
        color: [
          '#5470c6',
          '#91cc75',
          '#fac858',
          '#ee6666',
          '#73c0de'
        ][index]
      },
      barWidth: '80%'
    })) || [],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 0,
        height: 15,
        moveHandleSize: 6
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ]
  }

  const handleDownload = () => {
    const echartInstance = chartRef.current.getEchartsInstance()
    const base64 = echartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = `population_structure_${currentFile}.png`
    link.href = base64
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = () => {
    loadData(currentFile)
  }

  return (
    <div className="stacked-chart-container">
      <div className="chart-header">
        <Space>
          <Select
            value={currentFile}
            onChange={setCurrentFile}
            style={{ width: 120 }}
            options={Object.entries(FILE_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label
            }))}
          />
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            title="下载图片"
          >
            下载
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            title="刷新图表"
          >
            刷新
          </Button>
        </Space>
      </div>
      <ReactECharts 
        ref={chartRef}
        option={option}
        style={{ height: 'calc(100vh - 100px)', width: '100%' }}
      />
    </div>
  )
}

StackedBarChart.propTypes = {
  selectedSamples: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.arrayOf(PropTypes.object)
}

StackedBarChart.defaultProps = {
  selectedSamples: [],
  tableData: []
}

export default StackedBarChart 