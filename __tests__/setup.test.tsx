import { render, screen } from '@testing-library/react'

// Simple test to validate Jest setup
describe('Jest Setup', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Hello Test</div>
    render(<TestComponent />)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })
})