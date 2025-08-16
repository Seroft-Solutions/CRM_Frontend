import { render, screen } from '@/test-utils'
import { useLiveData } from '@/app/(protected)/(features)/shared/realtime/hooks/use-live-data'
import { renderHook, act } from '@testing-library/react'

// Mock the realtime context
const mockEmit = jest.fn()
const mockJoinRoom = jest.fn()
const mockLeaveRoom = jest.fn()
const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock('@/core/realtime/realtime-provider', () => ({
  useRealtime: () => ({
    emit: mockEmit,
    joinRoom: mockJoinRoom,
    leaveRoom: mockLeaveRoom,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}))

// Mock TanStack Query
const mockSetQueryData = jest.fn()
const mockGetQueryData = jest.fn()
const mockInvalidateQueries = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    getQueryData: mockGetQueryData,
    invalidateQueries: mockInvalidateQueries,
  }),
}))

describe('useLiveData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should join room for entity-specific updates', () => {
    const { unmount } = renderHook(() =>
      useLiveData({
        key: 'customer-123',
        entityType: 'customer',
        entityId: '123',
      })
    )

    expect(mockJoinRoom).toHaveBeenCalledWith('customer:123')

    unmount()
    expect(mockLeaveRoom).toHaveBeenCalledWith('customer:123')
  })

  it('should subscribe to relevant events', () => {
    renderHook(() =>
      useLiveData({
        key: 'customer-123',
        entityType: 'customer',
        entityId: '123',
      })
    )

    expect(mockSubscribe).toHaveBeenCalledWith('customer_updated', expect.any(Function))
    expect(mockSubscribe).toHaveBeenCalledWith('customer_deleted', expect.any(Function))
  })

  it('should provide optimistic update function', () => {
    const { result } = renderHook(() =>
      useLiveData({
        key: 'customer-123',
        entityType: 'customer',
        entityId: '123',
      })
    )

    expect(result.current.optimisticUpdate).toBeInstanceOf(Function)
    expect(result.current.rollback).toBeInstanceOf(Function)
    expect(result.current.sync).toBeInstanceOf(Function)
  })

  it('should emit events on optimistic updates', () => {
    mockGetQueryData.mockReturnValue({ id: 123, name: 'Old Name' })

    const { result } = renderHook(() =>
      useLiveData({
        key: 'customer-123',
        entityType: 'customer',
        entityId: '123',
      })
    )

    act(() => {
      result.current.optimisticUpdate((current) => ({
        ...current,
        name: 'New Name',
      }))
    })

    expect(mockEmit).toHaveBeenCalledWith('customer_updated', {
      data: { id: 123, name: 'New Name' },
      entityType: 'customer',
      entityId: '123',
      isOptimistic: true,
    })
  })
})