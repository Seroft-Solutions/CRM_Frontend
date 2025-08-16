import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Simple wrapper without complex providers for basic testing
const SimpleWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: SimpleWrapper, ...options })

export * from '@testing-library/react'
export { customRender as render }