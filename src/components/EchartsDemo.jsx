import { useState } from 'react'
import PCATable from './PCATable'
import PCAScatter from './PCAScatter'

const EchartsDemo = () => {
  const [selectedSamples, setSelectedSamples] = useState([])
  const [tableData, setTableData] = useState([])

  return (
    <div className="echarts-container">
      <div className="content-wrapper">
        <div className="left-panel">
          <PCATable 
            onSelectionChange={setSelectedSamples}
            onDataLoaded={setTableData}
          />
        </div>
        <div className="right-panel">
          <PCAScatter 
            selectedSamples={selectedSamples}
            tableData={tableData}
          />
        </div>
      </div>
    </div>
  )
}

export default EchartsDemo 