import React from 'react'

const EmptyState = () => {
  return (
    <div className='flex flex-col items-center justify-center py-16'>
        <img src="/empty-state.svg" alt="No Projects" className="w-48 h-48 mb-4" />
        <h2 className='text-xl font-semibold text-gray-500'>No Projects Found</h2>
        <p className="text-gray-400">Create new project to get started</p>
    </div>
  )
}

export default EmptyState