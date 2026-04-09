import { Table, Input, Button, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import PropTypes from 'prop-types'

const PCATable = ({ onSelectionChange }) => {
  const [tableData, setTableData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [searchText, setSearchText] = useState('')

  // 标准化样本名（将-转换为_）
  const normalizeId = (id) => id?.replace(/-/g, '_')

  const loadExcelData = useCallback(async () => {
    try {
      const response = await fetch('/重测序整理的样本信息.xlsx')
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(worksheet)
      
      const processedData = data.map((item, index) => ({
        ...item,
        分析样本名: normalizeId(item.分析样本名),
        key: normalizeId(item.分析样本名) || index.toString()
      }))
      
      setTableData(processedData)
      setFilteredData(processedData)
      setSelectedRows(processedData)
      onSelectionChange(processedData.map(item => item.分析样本名))
    } catch (error) {
      console.error('Error loading Excel data:', error)
    }
  }, [onSelectionChange])

  useEffect(() => {
    loadExcelData()
  }, [loadExcelData])

  // 搜索功能
  const handleSearch = (value) => {
    setSearchText(value)
    const filtered = tableData.filter(item => 
      ['分析样本名', '实际样本名', '品种名', '分类'].some(field => 
        item[field]?.toString().toLowerCase().includes(value.toLowerCase())
      )
    )
    setFilteredData(filtered)
  }

  // 全选/全不选功能
  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([])
      onSelectionChange([])
    } else {
      setSelectedRows(filteredData)
      onSelectionChange(filteredData.map(item => item.分析样本名))
    }
  }

  const columns = [
    {
      title: '分析样本名',
      dataIndex: '分析样本名',
      key: '分析样本名',
      sorter: (a, b) => a.分析样本名?.localeCompare(b.分析样本名),
      width: 150
    },
    {
      title: '实际样本名',
      dataIndex: '实际样本名',
      key: '实际样本名',
      sorter: (a, b) => a.实际样本名?.localeCompare(b.实际样本名),
      width: 150
    },
    {
      title: '品种名',
      dataIndex: '品种名',
      key: '品种名',
      sorter: (a, b) => a.品种名?.localeCompare(b.品种名),
      width: 150
    },
    {
      title: '分类',
      dataIndex: '分类',
      key: '分类',
      sorter: (a, b) => a.分类?.localeCompare(b.分类),
      width: 100
    }
  ]

  const rowSelection = {
    onChange: (_, selectedRows) => {
      setSelectedRows(selectedRows)
      onSelectionChange(selectedRows.map(row => row.分析样本名))
    },
    selectedRowKeys: selectedRows.map(row => row.key)
  }

  return (
    <div className="pca-table-wrapper">
      <div className="table-controls">
        <Space>
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Button onClick={handleSelectAll}>
            {selectedRows.length === filteredData.length ? '全不选' : '全选'}
          </Button>
        </Space>
      </div>
      <Table 
        dataSource={filteredData}
        columns={columns}
        rowSelection={rowSelection}
        scroll={{ y: 280 }}
        size="small"
      />
    </div>
  )
}

PCATable.propTypes = {
  onSelectionChange: PropTypes.func.isRequired
}

export default PCATable 