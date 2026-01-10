export const isSeatLocked = (seat, lockedSeats) => {
  return lockedSeats && lockedSeats.some(lockedSeat => lockedSeat.id === seat.id)
}

export const isSeatBooked = (seat, bookedSeats) => {
  return bookedSeats && bookedSeats.some(bookedSeat => bookedSeat.id === seat.id)
}

export const isSeatUnavailable = (seat) => {
  return !seat ||
         seat.status === 'OCCUPIED' ||
         seat.status === 'MAINTENANCE' ||
         seat.status === 'BLOCKED'
}

export const isSeatClickable = (seat, lockedSeats, bookedSeats) => {
  if (isSeatUnavailable(seat)) return false
  if (isSeatLocked(seat, lockedSeats)) return false
  if (isSeatBooked(seat, bookedSeats)) return false
  return true
}
