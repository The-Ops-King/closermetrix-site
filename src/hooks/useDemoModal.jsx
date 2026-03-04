import { createContext, useContext, useState } from 'react'

const DemoModalContext = createContext()

export const DemoModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = (e) => {
    if (e) e.preventDefault()
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  return (
    <DemoModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </DemoModalContext.Provider>
  )
}

export const useDemoModal = () => useContext(DemoModalContext)
