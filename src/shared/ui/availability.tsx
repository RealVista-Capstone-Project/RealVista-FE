"use client"

import * as React from "react"
import { Clock, Settings, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { ButtonGroup } from "@/shared/ui/button-group"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import tunnel from "tunnel-rat"
import { nanoid } from "nanoid"
import { isToday } from "date-fns"
import { Skeleton } from "@/shared/ui/skeleton/skeleton"

const EMPTY_ARRAY: any[] = []
const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6]

// --- Types ---

export interface TimeSpan<T extends AppointmentData = AppointmentData> {
  active?: boolean
  id: string
  week_day: number // 0-6 - Sunday-Saturday
  start_time: string // "HH:mm"
  end_time: string // "HH:mm"
  appointment?: T
}

export type AppointmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED'

export interface AppointmentData {
  appointment_id: string
  listing_id: string
  listing_name: string
  listing_address?: string
  sender_id: string
  sender_name: string
  receiver_id: string
  receiver_name: string
  start_time: string // ISO datetime
  end_time: string // ISO datetime
  status: AppointmentStatus
  appointment_type: 'TOUR' | 'BLOCK'
  sender_notes?: string
  rejection_reason?: string
  cancellation_reason?: string
  is_sender?: boolean
}

interface AvailabilityProps<T extends AppointmentData = AppointmentData> {
  value?: TimeSpan<T>[]
  onValueChange?: (value: TimeSpan<T>[]) => void
  disabled?: TimeSpan<T>[] // Disabled regions where no events can exist
  days?: number[] // 0-6
  showAllDays?: boolean // If true, renders all 7 days, but disables interactions on days not in 'days' array
  timeIncrements?: number // minutes, default 30
  startTime?: number // hour 0-23, default 7
  endTime?: number // hour 0-23, default 23
  useAmPm?: boolean
  mergeAdjacent?: boolean // default true - merge spans that touch end-to-end
  slotClassName?: string // className for time slot items (default: "bg-muted")
  className?: string
  // Mode selection
  mode?: 'view' | 'edit-availability' | 'edit-blocks'
  appointments?: T[]
  onAppointmentClick?: (appointment: T, date: string, startTime: string, endTime: string) => void
  // Week navigation
  currentWeekStart?: Date
  onWeekChange?: (weekStart: Date) => void
  locale?: 'vi' | 'en'
  renderAppointmentCard?: (appointment: T, dateString: string, startTime: string, endTime: string) => React.ReactNode
  filters?: React.ReactNode
  actions?: React.ReactNode
  isLoading?: boolean
}

function calculateOverlaps<T extends AppointmentData>(events: TimeSpan<T>[]) {
  const sorted = [...events].sort((a, b) => {
    const startA = timeToMinutes(a.start_time)
    const startB = timeToMinutes(b.start_time)
    if (startA !== startB) return startA - startB
    const endA = timeToMinutes(a.end_time)
    const endB = timeToMinutes(b.end_time)
    return (endB - startB) - (endA - startA)
  })

  const layoutMap = new Map<string, { left: number; width: number }>()
  let currentCluster: typeof sorted = []
  let clusterEnd = 0

  const processCluster = (cluster: typeof sorted) => {
    const columns: (typeof sorted)[] = []
    cluster.forEach((ev) => {
      let placed = false
      const start = timeToMinutes(ev.start_time)
      for (const col of columns) {
        const lastEv = col[col.length - 1]
        const lastEnd = timeToMinutes(lastEv.end_time)
        if (lastEnd <= start) {
          col.push(ev)
          placed = true
          break
        }
      }
      if (!placed) columns.push([ev])
    })

    const numCols = columns.length
    cluster.forEach((ev) => {
      const colIndex = columns.findIndex((col) => col.includes(ev))
      const offsetFactor = 8

      layoutMap.set(ev.id, {
        left: colIndex * offsetFactor,
        width: Math.max(100 - (colIndex * offsetFactor), 100 - (numCols - 1) * offsetFactor)
      })
    })
  }

  sorted.forEach((ev) => {
    const start = timeToMinutes(ev.start_time)
    const end = timeToMinutes(ev.end_time)
    if (currentCluster.length > 0 && start >= clusterEnd) {
      processCluster(currentCluster)
      currentCluster = [ev]
      clusterEnd = end
    } else {
      currentCluster.push(ev)
      clusterEnd = Math.max(clusterEnd, end)
    }
  })

  if (currentCluster.length > 0) processCluster(currentCluster)
  return layoutMap
}

// --- Utils ---

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

const formatDisplayTime = (time: string, useAmPm: boolean) => {
  if (!useAmPm) return time
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`
}

// Helper to generate a simple unique ID (not crypto secure but sufficient for UI)
const generateId = () => nanoid()

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const DAYS_VI = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  ACCEPTED: "bg-green-50 border-l-4 border-green-400 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-50 border-l-4 border-red-400 text-red-700 dark:bg-red-950 dark:text-red-300",
  CANCELED: "bg-gray-50 border-l-4 border-gray-400 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
  COMPLETED: "bg-blue-50 border-l-4 border-blue-400 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
}

/**
 * Merges adjacent (contiguous) time spans on the same day.
 * Adjacent means one span's end_time equals another's start_time.
 * The merged span keeps the id of the earliest span.
 */
const mergeAdjacentSpans = <T extends AppointmentData>(spans: TimeSpan<T>[]): TimeSpan<T>[] => {
  if (spans.length === 0) return spans

  // Group by day
  const byDay = new Map<number, TimeSpan<T>[]>()
  spans.forEach((span) => {
    const daySpans = byDay.get(span.week_day) || []
    daySpans.push(span)
    byDay.set(span.week_day, daySpans)
  })

  const merged: TimeSpan<T>[] = []

  // Process each day
  byDay.forEach((daySpans) => {
    // Sort by start time
    const sorted = [...daySpans].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

    let current = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]

      // Check if current and next are adjacent (touching)
      if (current.end_time === next.start_time) {
        // Merge: extend current to include next
        current = {
          ...current,
          end_time: next.end_time,
          // Keep the earliest span's id (current is already earlier due to sorting)
        }
      } else {
        // Not adjacent, push current and move to next
        merged.push(current)
        current = next
      }
    }

    // Push the last span
    merged.push(current)
  })

  return merged
}

// --- Hooks ---

/**
 * Hook to handle creation dragging logic on a day column.
 */
function useCalendarCreation({
  containerRef,
  timeIncrements,
  startTime,
  endTime,
  events,
  disabledEvents = [],
  onCreate,
  colIndex,
  isDayDisabled = false,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  timeIncrements: number
  startTime: number
  endTime: number
  events: TimeSpan[]
  disabledEvents?: TimeSpan[]
  onCreate: (dayIndex: number, start: number, end: number) => void
  colIndex: number
  isDayDisabled?: boolean
}) {
  const [isCreating, setIsCreating] = React.useState(false)
  const [creationStart, setCreationStart] = React.useState<number | null>(null)
  const [currentMouseY, setCurrentMouseY] = React.useState<number | null>(null)

  const totalMinutes = (endTime - startTime) * 60
  const startOffset = startTime * 60

  // Combine events and disabled regions for constraints
  // Sort all items by start time to determine safe zones
  const sortedConstraints = React.useMemo(() => {
    return [...events, ...disabledEvents].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  }, [events, disabledEvents])

  const getMinutesFromY = (y: number) => {
    if (!containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const relativeY = y - rect.top
    const percentage = Math.max(0, Math.min(1, relativeY / rect.height))
    const minutes = percentage * totalMinutes + startOffset
    return Math.round(minutes / timeIncrements) * timeIncrements
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDayDisabled) return // No interaction if day is fully disabled
    if (e.target !== e.currentTarget) return // Only trigger on empty space
    // Prevent default drag behavior and text selection, but allow touch scrolling if not handled
    e.preventDefault()

    // Capture pointer to track movement even if it leaves the element
    containerRef.current?.setPointerCapture(e.pointerId)

    const startMins = getMinutesFromY(e.clientY)

    // Check strict overlap at start point (cannot start creation inside an event or disabled region)
    const isOverlapping = sortedConstraints.some((ev) => {
      const s = timeToMinutes(ev.start_time)
      const e = timeToMinutes(ev.end_time)
      return startMins >= s && startMins < e
    })
    if (isOverlapping) return

    // Find constraints
    const prevEvent = sortedConstraints.filter((ev) => timeToMinutes(ev.end_time) <= startMins).pop()
    const nextEvent = sortedConstraints.find((ev) => timeToMinutes(ev.start_time) >= startMins)

    const minStartMins = prevEvent ? timeToMinutes(prevEvent.end_time) : startOffset
    const maxEndMins = nextEvent ? timeToMinutes(nextEvent.start_time) : endTime * 60

    setCreationStart(startMins)
    setCurrentMouseY(startMins)
    setIsCreating(true)

    const handlePointerMove = (ev: PointerEvent) => {
      const currentMins = getMinutesFromY(ev.clientY)
      // Clamp to constraints
      const clampedMins = Math.max(minStartMins, Math.min(currentMins, maxEndMins))
      setCurrentMouseY(clampedMins)
    }

    const handlePointerUp = (ev: PointerEvent) => {
      const currentMins = getMinutesFromY(ev.clientY)

      let finalStart = Math.min(startMins, currentMins)
      let finalEnd = Math.max(startMins, currentMins)

      // Clamp to constraints
      finalStart = Math.max(minStartMins, finalStart)
      finalEnd = Math.min(maxEndMins, finalEnd)

      // Ensure minimum size
      if (finalEnd - finalStart < timeIncrements) {
        finalEnd = Math.min(finalStart + timeIncrements, maxEndMins)
      }

      // Click-to-create logic (if essentially no drag occurred, try to make a 1-hour slot)
      if (finalEnd - finalStart <= timeIncrements) {
        const oneHourEnd = finalStart + 60
        finalEnd = Math.min(oneHourEnd, maxEndMins)
      }

      if (finalEnd > finalStart) {
        onCreate(colIndex, finalStart, finalEnd)
      }

      setIsCreating(false)
      setCreationStart(null)
      setCurrentMouseY(null)

      // Release pointer capture
      containerRef.current?.releasePointerCapture(ev.pointerId)

      // Cleanup listeners (though using setPointerCapture implicitly handles some of this, explicit cleanup is safe)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return {
    isCreating,
    creationStart,
    currentMouseY,
    totalMinutes,
    startOffset,
    sortedConstraints,
    handlePointerDown,
  }
}

// --- Components ---

// Context to share dragging state across components
const AvailabilityDragContext = React.createContext<{
  dragPreviewTunnel: ReturnType<typeof tunnel>
  activeId: string | null
  activeSpan: TimeSpan<any> | null
  overDayIndex: number | null
  deltaY: number
  timeIncrements: number
  isDropValid: boolean
} | null>(null)

export function Availability<T extends AppointmentData = AppointmentData>({
  value = EMPTY_ARRAY,
  onValueChange,
  disabled = EMPTY_ARRAY,
  days = DEFAULT_DAYS,
  showAllDays = true,
  timeIncrements = 30,
  startTime = 7,
  endTime = 17,
  useAmPm = false,
  mergeAdjacent = true,
  slotClassName = "bg-muted",
  className,
  mode = 'edit-availability',
  appointments = EMPTY_ARRAY,
  onAppointmentClick,
  currentWeekStart,
  onWeekChange,
  locale = 'vi',
  renderAppointmentCard,
  filters,
  actions,
  isLoading = false,
}: AvailabilityProps<T>) {
  const readOnly = mode === 'view'
  const isEditBlocks = mode === 'edit-blocks'
  const [internalValue, setInternalValue] = React.useState<TimeSpan<T>[]>(value as TimeSpan<T>[])
  const dragPreviewTunnel = React.useMemo(() => tunnel(), [])

  const dayNames = locale === 'vi' ? DAYS_VI : DAYS

  // Week navigation state
  const [weekStart, setWeekStart] = React.useState<Date>(
    currentWeekStart || (() => {
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(now.setDate(diff))
    })()
  )

  // Sync with prop
  React.useEffect(() => {
    if (currentWeekStart) setWeekStart(currentWeekStart)
  }, [currentWeekStart])

  const handlePrevWeek = () => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() - 7)
    setWeekStart(newDate)
    onWeekChange?.(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(weekStart)
    newDate.setDate(newDate.getDate() + 7)
    setWeekStart(newDate)
    onWeekChange?.(newDate)
  }

  const handleToday = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const todayStart = new Date(now.setDate(diff))
    setWeekStart(todayStart)
    onWeekChange?.(todayStart)
  }

  // Get week days
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  // Map appointments to time spans — only for the currently visible week
  const appointmentSpans = React.useMemo(() => {
    if (appointments.length === 0) return []
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= weekStart && aptDate <= weekEnd
      })
      .map((apt) => {
        const start = new Date(apt.start_time)
        const end = new Date(apt.end_time)
        const dayIndex = start.getDay()
        const startMinutes = start.getHours() * 60 + start.getMinutes()
        const endMinutes = end.getHours() * 60 + end.getMinutes()
        return {
          id: apt.appointment_id,
          week_day: dayIndex === 0 ? 6 : dayIndex - 1,
          start_time: `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`,
          end_time: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
          appointment: apt,
        }
      })
  }, [appointments, weekStart])

  // In edit-blocks mode, TOUR appointments are treated as disabled regions
  const tourDisabledSpans = React.useMemo(() => {
    if (!isEditBlocks) return []
    return appointmentSpans.filter((s) => s.appointment?.appointment_type === 'TOUR')
  }, [isEditBlocks, appointmentSpans])


  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [overDayIndex, setOverDayIndex] = React.useState<number | null>(null)
  const [deltaY, setDeltaY] = React.useState(0)
  const [isDropValid, setIsDropValid] = React.useState(true)

  const mainContainerRef = React.useRef<HTMLDivElement>(null)

  // Determine which days to render
  const renderedDays = React.useMemo(() => {
    if (showAllDays) {
      return [0, 1, 2, 3, 4, 5, 6]
    }
    return days
  }, [days, showAllDays])

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const updateValue = (newValue: TimeSpan<T>[], shouldMerge = false) => {
    const finalValue = shouldMerge && mergeAdjacent ? mergeAdjacentSpans(newValue) : newValue
    setInternalValue(finalValue)
    onValueChange?.(finalValue)
  }

  const handleResize = (id: string, newStart: string, newEnd: string, isComplete = false) => {
    const newValue = internalValue.map((span) => {
      if (span.id === id) {
        return { ...span, start_time: newStart, end_time: newEnd }
      }
      return span
    })
    updateValue(newValue, isComplete)
  }

  const handleCreate = (dayIndex: number, startMinutes: number, endMinutes: number) => {
    const newSpan: TimeSpan<T> = {
      id: generateId(),
      week_day: dayIndex, // Directly use the dayIndex (0-6)
      start_time: minutesToTime(startMinutes),
      end_time: minutesToTime(endMinutes),
      active: true,
    }
    updateValue([...internalValue, newSpan], true)
  }

  const handleDelete = (id: string) => {
    updateValue(
      internalValue.filter((s) => s.id !== id),
      true,
    )
  }

  const handleMove = (id: string, newStart: string, newEnd: string, newDayIndex: number) => {
    const newValue = internalValue.map((span) => {
      if (span.id === id) {
        return { ...span, start_time: newStart, end_time: newEnd, week_day: newDayIndex }
      }
      return span
    })
    updateValue(newValue, true)
  }

  // Validation helper
  const validatePlacement = (
    span: TimeSpan,
    targetDayIndex: number,
    deltaY: number,
    containerHeight: number,
  ): { isValid: boolean; newStart: number; duration: number } => {
    const totalMinutes = (endTime - startTime) * 60
    const pixelsPerMinute = containerHeight / totalMinutes
    const deltaMinutesRaw = deltaY / pixelsPerMinute
    const deltaMinutes = Math.round(deltaMinutesRaw / timeIncrements) * timeIncrements

    const originalStart = timeToMinutes(span.start_time)
    const duration = timeToMinutes(span.end_time) - originalStart

    const newStart = originalStart + deltaMinutes
    const newEnd = newStart + duration

    // Check bounds
    const dayStartMins = startTime * 60
    const dayEndMins = endTime * 60

    if (newStart < dayStartMins || newEnd > dayEndMins) {
      return { isValid: false, newStart, duration }
    }

    // Check if day is active (in allowed days list)
    if (!days.includes(targetDayIndex)) {
      return { isValid: false, newStart, duration }
    }

    // Check collisions with active events
    const dayEvents = internalValue.filter((e) => e.week_day === targetDayIndex && e.id !== span.id)
    const hasEventOverlap = dayEvents.some((e) => {
      const eStart = timeToMinutes(e.start_time)
      const eEnd = timeToMinutes(e.end_time)
      return newStart < eEnd && newEnd > eStart
    })

    if (hasEventOverlap) {
      return { isValid: false, newStart, duration }
    }

    // Check collisions with disabled regions
    const dayDisabled = [
      ...disabled.filter((e) => e.week_day === targetDayIndex),
      ...tourDisabledSpans.filter((e) => e.week_day === targetDayIndex)
    ]
    const hasDisabledOverlap = dayDisabled.some((e) => {
      const eStart = timeToMinutes(e.start_time)
      const eEnd = timeToMinutes(e.end_time)
      return newStart < eEnd && newEnd > eStart
    })

    if (hasDisabledOverlap) {
      return { isValid: false, newStart, duration }
    }

    return { isValid: true, newStart, duration }
  }

  // DnD Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setDeltaY(0)
    setOverDayIndex(null)
    setIsDropValid(true)
  }

  const handleDragMove = (event: DragMoveEvent) => {
    setDeltaY(event.delta.y)
    checkValidity(event.active.id as string, event.over?.id, event.delta.y)
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      const dayIndex = parseInt(event.over.id.toString().replace("day-", ""), 10)
      if (!isNaN(dayIndex)) {
        setOverDayIndex(dayIndex)
      }
    } else {
      setOverDayIndex(null)
    }
    checkValidity(event.active.id as string, event.over?.id, event.delta.y)
  }

  const checkValidity = (activeId: string, overId: string | number | undefined, currentDeltaY: number) => {
    if (!mainContainerRef.current || !overId) {
      setIsDropValid(false)
      return
    }

    const span = internalValue.find((s) => s.id === activeId)
    if (!span) return

    const targetDayIndex = parseInt(overId.toString().replace("day-", ""), 10)
    if (isNaN(targetDayIndex)) {
      setIsDropValid(false)
      return
    }

    const result = validatePlacement(span, targetDayIndex, currentDeltaY, mainContainerRef.current.clientHeight)
    setIsDropValid(result.isValid)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverDayIndex(null)
    setDeltaY(0)
    setIsDropValid(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event
    setActiveId(null)
    setOverDayIndex(null)
    setDeltaY(0)
    setIsDropValid(true)

    const span = internalValue.find((s) => s.id === active.id)
    if (!span || !mainContainerRef.current || !over) return

    const targetDayIndex = parseInt(over.id.toString().replace("day-", ""), 10)
    if (isNaN(targetDayIndex)) return

    // Final validation before commit
    const { isValid, newStart, duration } = validatePlacement(
      span,
      targetDayIndex,
      delta.y,
      mainContainerRef.current.clientHeight,
    )

    if (!isValid) {
      // Invalid drop, do nothing (snaps back)
      return
    }

    const newEndVal = newStart + duration
    handleMove(span.id, minutesToTime(newStart), minutesToTime(newEndVal), targetDayIndex)
  }

  const activeSpan = React.useMemo(() => internalValue.find((s) => s.id === activeId) || null, [activeId, internalValue])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <AvailabilityDragContext.Provider
        value={{
          dragPreviewTunnel,
          activeId,
          activeSpan,
          overDayIndex,
          deltaY,
          timeIncrements,
          isDropValid,
        }}
      >
        <div
          suppressHydrationWarning
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-md border bg-background select-none touch-none",
            className,
          )}
        >
          {/* Toolbar: filters left, week navigation + actions right */}
          {(readOnly || isEditBlocks) && (
            <div className="flex items-center justify-between border-b px-3 py-2 gap-3">
              {/* Left slot: consumer-provided filters */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {filters}
              </div>
              {/* Right slot: week navigation + optional actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions && (
                  <>
                    {actions}
                    <div className="h-5 w-px bg-border" />
                  </>
                )}
                <ButtonGroup>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevWeek}
                    className="h-8 w-8 p-0"
                    title={locale === 'vi' ? 'Trước' : 'Prev'}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    className="h-8 px-3 text-xs"
                  >
                    {locale === 'vi' ? 'Hôm nay' : 'Today'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextWeek}
                    className="h-8 w-8 p-0"
                    title={locale === 'vi' ? 'Sau' : 'Next'}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Skeleton header — mirrors real day header */}
              <div className="flex w-full border-b bg-muted/40">
                <div className="w-16 flex-shrink-0 border-r p-2" />
                <div className="flex flex-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r px-2 py-3 last:border-r-0 flex flex-col items-center gap-1.5">
                      <Skeleton className="h-3.5 w-10" />
                      <Skeleton className="h-3 w-7" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Skeleton body */}
              <div className="flex flex-1 overflow-hidden" style={{ minHeight: '400px' }}>
                {/* Time labels column */}
                <div className="w-16 flex-shrink-0 border-r bg-muted/10 flex flex-col">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 border-b border-dashed border-muted-foreground/20 pl-3 flex items-center">
                      <Skeleton className="h-3 w-9" />
                    </div>
                  ))}
                </div>
                {/* Day columns */}
                <div className="flex flex-1 relative">
                  {/* Dashed hour lines overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex-1 border-b border-dashed border-foreground/10 dark:border-muted/60" />
                    ))}
                  </div>
                  {/* Appointment skeletons — scattered realistically */}
                  {Array.from({ length: 7 }).map((_, col) => {
                    // Each column gets 0-2 appointment skeletons at varied positions
                    const appts: { top: string; height: string; delay: string }[] = []
                    if (col === 0) appts.push({ top: '10%', height: '18%', delay: '0ms' })
                    if (col === 1) appts.push({ top: '28%', height: '14%', delay: '100ms' }, { top: '58%', height: '10%', delay: '200ms' })
                    if (col === 2) appts.push({ top: '5%', height: '22%', delay: '50ms' })
                    if (col === 3) appts.push({ top: '40%', height: '16%', delay: '150ms' }, { top: '70%', height: '12%', delay: '300ms' })
                    if (col === 4) appts.push({ top: '15%', height: '20%', delay: '80ms' })
                    if (col === 5) appts.push({ top: '33%', height: '25%', delay: '250ms' })
                    if (col === 6) appts.push({ top: '50%', height: '15%', delay: '120ms' })
                    return (
                      <div key={col} className="flex-1 border-r last:border-r-0 relative">
                        {appts.map((a, j) => (
                          <Skeleton
                            key={j}
                            className="absolute mx-1 rounded-md"
                            style={{
                              top: a.top,
                              height: a.height,
                              left: '4px',
                              right: '4px',
                              animationDelay: a.delay,
                            }}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="flex w-full border-b bg-muted/40">
            <div className="w-16 flex-shrink-0 border-r p-2 text-xs font-medium text-muted-foreground" />
            <div className="flex flex-1">
              {(readOnly || isEditBlocks ? weekDays : renderedDays).map((day, idx) => {
                const isDate = day instanceof Date
                const dayIndex = isDate
                  ? (day.getDay() === 0 ? 6 : day.getDay() - 1)
                  : (day as number)
                const todayCol = isDate && isToday(day)
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 border-r px-2 py-3 text-center text-sm font-medium last:border-r-0",
                      !readOnly && !isEditBlocks && !days.includes(dayIndex) && "bg-muted/30 text-muted-foreground",
                      todayCol && "bg-purple-96 dark:bg-purple-96/10",
                    )}
                  >
                    <div className={cn(todayCol && "text-main-primary font-semibold")}>
                      {(readOnly || isEditBlocks) && isDate ? dayNames[day.getDay()] : dayNames[(dayIndex + 1) % 7]}
                    </div>
                    {(readOnly || isEditBlocks) && isDate && (
                      <div className={cn("text-xs", todayCol ? "text-main-primary/70 font-medium" : "text-muted-foreground")}>
                        {String(day.getDate()).padStart(2, '0')}/{String(day.getMonth() + 1).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-y-auto relative" ref={mainContainerRef}>
            <div className="flex w-full relative" style={{ minHeight: `${(endTime - startTime) * 120}px` }}>
              {/* Time Labels */}
              <div className="w-16 flex-shrink-0 border-r bg-muted/10 flex flex-col">
                {Array.from({ length: endTime - startTime }).map((_, i) => {
                  const hour = startTime + i
                  return (
                    <div
                      key={hour}
                      className="flex-1 border-b border-dashed border-muted-foreground/20 relative flex items-center justify-start pl-3"
                    >
                      <span className="text-xs text-muted-foreground">{formatDisplayTime(`${hour}:00`, useAmPm)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Days Grid */}
              <div className="flex flex-1 relative">
                <div className="absolute inset-0 pointer-events-none flex flex-col">
                  {Array.from({ length: endTime - startTime }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-b border-dashed border-foreground/10 dark:border-muted/60 w-full relative"
                    />
                  ))}
                </div>

                {Array.from({ length: (readOnly || isEditBlocks) ? 7 : renderedDays.length }).map((_, i) => {
                  const dayIndex = (readOnly || isEditBlocks) ? i : renderedDays[i]
                  const dayAppointments = readOnly
                    ? appointmentSpans.filter((e) => e.week_day === i)
                    : internalValue.filter((e) => e.week_day === dayIndex)
                  const colDay = (readOnly || isEditBlocks) ? weekDays[i] : null
                  const todayCol = colDay instanceof Date && isToday(colDay)

                  return (
                    <DayColumn<T>
                      key={i}
                      dayIndex={i}
                      colIndex={i}
                      startTime={startTime}
                      endTime={endTime}
                      timeIncrements={timeIncrements}
                      events={isEditBlocks ? internalValue.filter((e) => e.week_day === dayIndex) : dayAppointments}
                      disabledEvents={readOnly ? [] : [
                        ...disabled.filter((e) => e.week_day === dayIndex),
                        ...(isEditBlocks ? tourDisabledSpans.filter((e) => e.week_day === dayIndex) : [])
                      ]}
                      onCreate={readOnly ? () => { } : handleCreate}
                      onResize={readOnly ? () => { } : handleResize}
                      onDelete={readOnly ? () => { } : handleDelete}
                      useAmPm={useAmPm}
                      isDayDisabled={readOnly ? false : (!isEditBlocks && !days.includes(dayIndex))}
                      readOnly={readOnly}
                      isEditBlocks={isEditBlocks}
                      onAppointmentClick={onAppointmentClick}
                      renderAppointmentCard={renderAppointmentCard}
                      weekStart={weekStart}
                      isTodayCol={todayCol}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeSpan && (
              <div className="w-full h-full cursor-grabbing relative opacity-80">
                <dragPreviewTunnel.Out />
              </div>
            )}
          </DragOverlay>
            </>
          )}
        </div>
      </AvailabilityDragContext.Provider>
    </DndContext>
  )
}

interface DayColumnProps<T extends AppointmentData = AppointmentData> {
  dayIndex: number
  colIndex: number
  startTime: number
  endTime: number
  timeIncrements: number
  events: TimeSpan<T>[]
  disabledEvents?: TimeSpan<T>[]
  onCreate: (dayIndex: number, start: number, end: number) => void
  onResize: (id: string, start: string, end: string, isComplete?: boolean) => void
  onDelete: (id: string) => void
  useAmPm: boolean
  isDayDisabled?: boolean
  slotClassName?: string
  readOnly?: boolean
  isEditBlocks?: boolean

  weekStart: Date
  isTodayCol?: boolean
  onAppointmentClick?: (appointment: T, date: string, startTime: string, endTime: string) => void
  renderAppointmentCard?: (appointment: T, date: string, startTime: string, endTime: string) => React.ReactNode
}

function DayColumn<T extends AppointmentData = AppointmentData>({
  dayIndex,
  colIndex,
  startTime,
  endTime,
  timeIncrements,
  events,
  disabledEvents = [],
  onCreate,
  onResize,
  onDelete,
  useAmPm,
  isDayDisabled = false,
  slotClassName = "bg-muted",
  readOnly = false,
  isEditBlocks = false,

  weekStart,
  isTodayCol = false,
  onAppointmentClick,
  renderAppointmentCard,
}: DayColumnProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const context = React.useContext(AvailabilityDragContext)

  const { setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
    disabled: isDayDisabled,
  })

  const mergedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node
    setNodeRef(node)
  }

  const { isCreating, creationStart, currentMouseY, totalMinutes, startOffset, sortedConstraints, handlePointerDown } =
    useCalendarCreation({
      containerRef,
      timeIncrements,
      startTime,
      endTime,
      events,
      disabledEvents,
      onCreate,
      colIndex,
      isDayDisabled,
    })

  const showGhost = context?.activeId && context.overDayIndex === dayIndex && containerRef.current && !isDayDisabled

  const ghostStyle = React.useMemo(() => {
    if (!showGhost || !context?.activeSpan || !containerRef.current) return null

    const span = context.activeSpan
    const containerHeight = containerRef.current.clientHeight
    const pixelsPerMinute = containerHeight / totalMinutes
    const deltaY = context.deltaY / pixelsPerMinute
    const deltaMinutes = Math.round(deltaY / timeIncrements) * timeIncrements

    const originalStart = timeToMinutes(span.start_time)
    const duration = timeToMinutes(span.end_time) - originalStart
    const newStart = originalStart + deltaMinutes

    return {
      top: `${((newStart - startOffset) / totalMinutes) * 100}%`,
      height: `${(duration / totalMinutes) * 100}%`,
    }
  }, [context?.deltaY, context?.activeSpan, totalMinutes, startOffset, showGhost, timeIncrements])

  const layouts = React.useMemo(() => calculateOverlaps(events), [events])

  return (
    <div
      ref={mergedRef}
      className={cn(
        "flex-1 relative border-r last:border-r-0 min-w-[100px] touch-none",
        isDayDisabled && "bg-muted/30",
        isTodayCol && "bg-purple-98 dark:bg-purple-96/10",
        context?.activeId && "z-10",
      )}
      onPointerDown={handlePointerDown}
    >
      {isDayDisabled && (
        <div
          className="absolute inset-0 bg-muted/10 pointer-events-none z-20"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(128,128,128,0.15) 5px, rgba(128,128,128,0.15) 10px)`,
          }}
        />
      )}

      {disabledEvents.map((disabled, i) => {
        const startMins = timeToMinutes(disabled.start_time)
        const endMins = timeToMinutes(disabled.end_time)
        const duration = endMins - startMins
        return (
          <div
            key={`disabled-${i}`}
            className="absolute left-0 right-0 bg-muted/40 bg-stripes-muted pointer-events-none z-0"
            style={{
              top: `${((startMins - startOffset) / totalMinutes) * 100}%`,
              height: `${(duration / totalMinutes) * 100}%`,
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(128,128,128,0.15) 5px, rgba(128,128,128,0.15) 10px)`,
            }}
          />
        )
      })}

      {ghostStyle && (
        <div
          className={cn(
            "absolute rounded-md border z-0 pointer-events-none transition-all duration-100 ease-out",
            context?.isDropValid ? "bg-foreground/20 border-foreground/30" : "bg-destructive/20 border-destructive/50",
          )}
          style={{ ...ghostStyle, left: "4px", width: "calc(100% - 8px)" }}
        />
      )}

      <div className="relative w-full h-full pointer-events-none">
        {events.map((event) => {
          const otherConstraints = sortedConstraints.filter((e) => e.id !== event.id)
          const eventStart = timeToMinutes(event.start_time)
          const eventEnd = timeToMinutes(event.end_time)
          const prevItem = otherConstraints.filter((e) => timeToMinutes(e.end_time) <= eventStart).pop()
          const nextItem = otherConstraints.find((e) => timeToMinutes(e.start_time) >= eventEnd)
          const minStart = prevItem ? timeToMinutes(prevItem.end_time) : startOffset
          const maxEnd = nextItem ? timeToMinutes(nextItem.start_time) : endTime * 60
          const isDragging = context?.activeId === event.id

          const dayDate = new Date(weekStart)
          dayDate.setDate(dayDate.getDate() + dayIndex)
          const dateString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
          const layout = layouts.get(event.id)

          if (!layout) return null

          return (
            <DraggableTimeSpan
              key={event.id}
              span={event}
              startTime={startTime}
              endTime={endTime}
              minStart={minStart}
              maxEnd={maxEnd}
              onResize={onResize}
              onDelete={onDelete}
              useAmPm={useAmPm}
              timeIncrements={timeIncrements}
              containerRef={containerRef}
              isDragging={isDragging}
              isLocked={isDayDisabled}
              readOnly={readOnly}
              isEditBlocks={isEditBlocks}
              slotClassName={slotClassName}
              onAppointmentClick={onAppointmentClick}
              renderAppointmentCard={renderAppointmentCard}
              dateString={dateString}
              layoutLeft={layout.left}
              layoutWidth={layout.width}
            />
          )
        })}
      </div>

      {isCreating && creationStart !== null && currentMouseY !== null && (
        <div
          className="absolute left-0 right-0 mx-1 rounded bg-primary/30 border border-primary z-20 pointer-events-none"
          style={{
            top: `${((Math.min(creationStart, currentMouseY) - startOffset) / totalMinutes) * 100}%`,
            height: `${(Math.abs(currentMouseY - creationStart) / totalMinutes) * 100}%`,
          }}
        />
      )}
    </div>
  )
}

interface DraggableTimeSpanProps<T extends AppointmentData = AppointmentData> {
  span: TimeSpan<T>
  startTime: number
  endTime: number
  minStart: number
  maxEnd: number
  onResize: (id: string, start: string, end: string, isComplete?: boolean) => void
  onDelete: (id: string) => void
  useAmPm: boolean
  timeIncrements: number
  containerRef: React.RefObject<HTMLDivElement | null>
  isDragging?: boolean
  isLocked?: boolean
  readOnly?: boolean
  isEditBlocks?: boolean
  slotClassName?: string
  onAppointmentClick?: (appointment: T, date: string, startTime: string, endTime: string) => void
  renderAppointmentCard?: (appointment: T, dateString: string, startTime: string, endTime: string) => React.ReactNode
  dateString?: string
  layoutLeft?: number
  layoutWidth?: number
}

function DraggableTimeSpan<T extends AppointmentData = AppointmentData>({
  span,
  startTime,
  endTime,
  minStart,
  maxEnd,
  onResize,
  onDelete,
  useAmPm,
  timeIncrements,
  containerRef,
  isDragging,
  isLocked = false,
  readOnly = false,
  isEditBlocks = false,
  slotClassName = "bg-muted",
  onAppointmentClick,
  renderAppointmentCard,
  dateString,
  layoutLeft,
  layoutWidth,
}: DraggableTimeSpanProps<T>) {
  const context = React.useContext(AvailabilityDragContext)
  const isTourInEditBlocks = isEditBlocks && span.appointment?.appointment_type === 'TOUR'
  const isBusyBlock = readOnly && span.appointment?.appointment_type === 'BLOCK'
  const isBlockInEditMode = isEditBlocks && span.appointment?.appointment_type === 'BLOCK'
  const isInteractionDisabled = isLocked || readOnly || isTourInEditBlocks

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: span.id,
    data: span,
    disabled: isInteractionDisabled,
  })

  const startMinutes = timeToMinutes(span.start_time)
  const endMinutes = timeToMinutes(span.end_time)
  const totalMinutes = (endTime - startTime) * 60
  const startOffset = startTime * 60
  const durationMinutes = endMinutes - startMinutes

  const style: React.CSSProperties = {
    top: `${((startMinutes - startOffset) / totalMinutes) * 100}%`,
    height: `${(durationMinutes / totalMinutes) * 100}%`,
    left: layoutLeft !== undefined ? `${layoutLeft}%` : "4px",
    width: layoutWidth !== undefined ? `calc(${layoutWidth}% - 4px)` : "calc(100% - 8px)",
    opacity: isDragging ? 0 : (isLocked || isTourInEditBlocks) ? 0.4 : isBusyBlock ? 0.8 : 1,
    zIndex: layoutLeft !== undefined ? Math.floor(layoutLeft) : 1,
    ...(isBusyBlock && {
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(128,128,128,0.2) 5px, rgba(128,128,128,0.2) 10px)`
    })
  }

  const handleResizeStart = (e: React.PointerEvent, edge: "top" | "bottom") => {
    if (isLocked || readOnly) return
    e.stopPropagation()
    e.preventDefault()

    const target = e.target as HTMLElement
    target.setPointerCapture(e.pointerId)
    const initialY = e.clientY
    const initialStart = startMinutes
    const initialEnd = endMinutes

    const handlePointerMove = (ev: PointerEvent) => {
      if (!containerRef.current) return
      const containerHeight = containerRef.current.clientHeight
      const pixelsPerMinute = containerHeight / totalMinutes
      const deltaY = ev.clientY - initialY
      const deltaMinutes = Math.round(deltaY / pixelsPerMinute / timeIncrements) * timeIncrements

      if (deltaMinutes === 0) return

      let newStart = initialStart
      let newEnd = initialEnd

      if (edge === "top") {
        newStart += deltaMinutes
        if (newStart < minStart) newStart = minStart
        if (newStart >= newEnd - timeIncrements) newStart = newEnd - timeIncrements
      } else {
        newEnd += deltaMinutes
        if (newEnd > maxEnd) newEnd = maxEnd
        if (newEnd <= newStart + timeIncrements) newEnd = newStart + timeIncrements
      }
      onResize(span.id, minutesToTime(newStart), minutesToTime(newEnd), false)
    }

    const handlePointerUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId)
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        const pixelsPerMinute = containerHeight / totalMinutes
        const deltaY = ev.clientY - initialY
        const deltaMinutes = Math.round(deltaY / pixelsPerMinute / timeIncrements) * timeIncrements
        let newStart = initialStart
        let newEnd = initialEnd
        if (edge === "top") {
          newStart += deltaMinutes
          if (newStart < minStart) newStart = minStart
          if (newStart >= newEnd - timeIncrements) newStart = newEnd - timeIncrements
        } else {
          newEnd += deltaMinutes
          if (newEnd > maxEnd) newEnd = maxEnd
          if (newEnd <= newStart + timeIncrements) newEnd = newStart + timeIncrements
        }
        onResize(span.id, minutesToTime(newStart), minutesToTime(newEnd), true)
      }
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const canResize = !isInteractionDisabled
  const content = (
    <div
      ref={isInteractionDisabled ? null : setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "absolute p-1 text-xs overflow-hidden transition-all duration-200 ease-in-out",
        !isInteractionDisabled && "cursor-grab active:cursor-grabbing",
        "rounded-md border shadow-sm h-full w-full",
        span.appointment && !isBusyBlock && !isBlockInEditMode ? APPOINTMENT_STATUS_COLORS[span.appointment.status] : slotClassName,
        isBusyBlock && "bg-muted/30 border-muted-foreground/20 shadow-none pointer-events-none",
        isBlockInEditMode && "bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300",
        isTourInEditBlocks && "grayscale-[0.5] border-dashed border-muted-foreground/30"
      )}
      onClick={() => {
        if (onAppointmentClick && span.appointment && dateString) {
          onAppointmentClick(span.appointment, dateString, span.start_time, span.end_time)
        }
      }}
    >
      {isBusyBlock ? null : renderAppointmentCard && span.appointment && dateString && !isTourInEditBlocks ? (
        <div className="h-full z-10 relative">
          {renderAppointmentCard(span.appointment, dateString, span.start_time, span.end_time)}
        </div>
      ) : (
        <TimeSpanCard
          span={span}
          useAmPm={useAmPm}
          onDelete={canResize ? () => onDelete(span.id) : undefined}
        />
      )}
    </div>
  )

  return (
    <>
      <div
        style={style}
        className={cn(
          "absolute group h-full w-full pointer-events-auto",
          !readOnly && isLocked && "opacity-60",
        )}
      >
        {canResize && (
          <div
            className="absolute top-0 left-0 right-0 h-4 -mt-2 cursor-row-resize z-20"
            onPointerDown={(e) => handleResizeStart(e, "top")}
          />
        )}

        {content}

        {canResize && (
          <div
            className="absolute bottom-0 left-0 right-0 h-4 -mb-2 cursor-row-resize z-20"
            onPointerDown={(e) => handleResizeStart(e, "bottom")}
          />
        )}
      </div>

      {isDragging && context && (
        <context.dragPreviewTunnel.In>
          <div
            className={cn(
              "absolute left-0 right-0 rounded-md border p-3 shadow-lg text-xs overflow-hidden h-full w-full",
              context.isDropValid ? "border-foreground/50 bg-foreground/10" : "border-destructive/50 bg-destructive/20",
            )}
          >
            <TimeSpanCard span={span} useAmPm={useAmPm} />
          </div>
        </context.dragPreviewTunnel.In>
      )}
    </>
  )
}

function TimeSpanCard({
  span,
  useAmPm,
  duration,
  onDelete,
}: {
  span: TimeSpan
  useAmPm: boolean
  duration?: number
  onDelete?: () => void
}) {
  const calculatedDuration = duration || (timeToMinutes(span.end_time) - timeToMinutes(span.start_time)) / 60

  return (
    <div className="h-full flex flex-col relative items-between p-2 text-foreground timespan-inner-area pointer-events-none">
      <div className="flex flex-col gap-0.5 text-inherit">
        <p className="font-semibold leading-none">{formatDisplayTime(span.start_time, useAmPm)}</p>
        <div className="flex items-center gap-0.5">
          <Clock className="h-2 w-2" />{" "}
          <p className="text-[10px] opacity-80">{calculatedDuration.toFixed(1).replace(".0", "")}h</p>
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-foreground/5 dark:hover:bg-foreground/10 -mt-1 -mr-1 absolute top-0 right-0 z-20 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <div className="flex flex-col gap-1 mt-auto text-inherit">
        {!onDelete && <Settings className="h-3 w-3 opacity-50" />}
        <p className="font-semibold leading-none !text-inherit">{formatDisplayTime(span.end_time, useAmPm)}</p>
      </div>
    </div>
  )
}
