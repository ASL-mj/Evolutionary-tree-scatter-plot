import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Menu } from 'antd'
import EchartsDemo from './components/EchartsDemo'
import StackedBarChart from './components/StackedBarChart'
import PhylogeneticTree from './components/PhylogeneticTree'
import Dashboard from './components/Dashboard'
import NewTree from './components/NewTree'
import './App.css'

function App() {
  const menuItems = [
    {
      key: 'dashboard',
      label: <Link to="/">数据总览</Link>
    },
    {
      key: 'pca',
      label: <Link to="/pca">PCA 分析</Link>
    },
    {
      key: 'stacked',
      label: <Link to="/stacked">群体结构 统计</Link>
    },
    {
      key: 'tree',
      label: <Link to="/tree">进化树</Link>
    },
    {
      key: 'newtree',
      label: <Link to="/newtree">新进化树</Link>
    }
  ]

  return (
    <Router>
      <div className="app-container">
        <Menu 
          mode="horizontal" 
          items={menuItems}
          className="nav-menu"
        />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pca" element={<EchartsDemo />} />
          <Route path="/stacked" element={<StackedBarChart />} />
          <Route path="/tree" element={<PhylogeneticTree />} />
          <Route path="/newtree" element={<NewTree />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 