import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import NewMetricPage from './pages/NewMetricPage'

function PlaceholderPage({ title }) {
  return (
    <section className="page">
      <h1>{title}</h1>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<PlaceholderPage title="Главная" />} />
          <Route path="/metrics" element={<PlaceholderPage title="Метрики" />} />
          <Route path="/metrics/new" element={<NewMetricPage />} />
          <Route path="/history" element={<PlaceholderPage title="История" />} />
          <Route path="/profile" element={<PlaceholderPage title="Профиль" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
