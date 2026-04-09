import { Row, Col, Card } from 'antd'
import { useState } from 'react'
import PCATable from './PCATable'
import PCAScatter from './PCAScatter'
import StackedBarChart from './StackedBarChart'
import PhylogeneticTree from './PhylogeneticTree'

const Dashboard = () => {
  const [selectedSamples, setSelectedSamples] = useState([])
  const [tableData, setTableData] = useState([])

  return (
    <div className="dashboard-container">
      <Row gutter={[16, 16]}>
        {/* Excel 表格 */}
        <Col span={24}>
          <Card 
            title="样本信息表" 
            className="dashboard-card table-card"
            bodyStyle={{ height: '450px', padding: '12px' }}
          >
            <PCATable 
              onSelectionChange={setSelectedSamples}
              onDataLoaded={setTableData}
            />
          </Card>
        </Col>

        {/* PCA 分析和进化树并排 */}
        <Col span={12}>
          <Card 
            title="PCA 分析" 
            className="dashboard-card"
            bodyStyle={{ height: '600px', padding: '12px' }}
          >
            <PCAScatter 
              selectedSamples={selectedSamples}
              tableData={tableData}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title="进化树分析" 
            className="dashboard-card"
            bodyStyle={{ height: '600px', padding: '10px' }}
          >
            <PhylogeneticTree 
              selectedSamples={selectedSamples}
              tableData={tableData}
            />
          </Card>
        </Col>

        {/* 群体结构分析 */}
        <Col span={24}>
          <Card 
            title="群体结构分析" 
            className="dashboard-card"
            bodyStyle={{ height: '400px', padding: '12px' }}
          >
            <StackedBarChart 
              selectedSamples={selectedSamples}
              tableData={tableData}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard 