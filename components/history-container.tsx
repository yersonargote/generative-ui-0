import React from 'react'
import { History } from './history'

type HistoryContainerProps = {
  location: 'sidebar' | 'header'
  userId?: string
}

const HistoryContainer: React.FC<HistoryContainerProps> = async ({
  location,
  userId
}) => {
  return (
    <div className="sm:hidden block">
      <History location={location} userId={userId} />
    </div>
  )
}

export default HistoryContainer
