import { Response } from 'express'
import { prisma } from "../prisma"
import { AuthRequest } from '../middleware/auth.middleware'
import { Logger } from '../utils/helpers'

const logger = new Logger('EventsController')

export class EventsController {
  // Get all events for a user
  async getAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const events = await prisma.event.findMany({
        where: { userId },
        orderBy: { datetime: 'asc' },
      })

      res.json(events)
    } catch (error) {
      logger.error('Error fetching events', error)
      res.status(500).json({ message: 'Failed to fetch events' })
    }
  }

  // Get event by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId
      const { id } = req.params

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const event = await prisma.event.findFirst({
        where: { id, userId },
      })

      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }

      res.json(event)
    } catch (error) {
      logger.error('Error fetching event', error)
      res.status(500).json({ message: 'Failed to fetch event' })
    }
  }

  // Create a new event
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const { title, client, type, datetime, location, status, notes } = req.body

      if (!title || !client || !type || !datetime || !location) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const event = await prisma.event.create({
        data: {
          userId,
          title,
          client,
          type,
          datetime: new Date(datetime),
          location,
          status: status || 'Pendente',
          notes,
        },
      })

      logger.log('Event created', { eventId: event.id })
      res.status(201).json(event)
    } catch (error) {
      logger.error('Error creating event', error)
      res.status(500).json({ message: 'Failed to create event' })
    }
  }

  // Update an event
  async update(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId
      const { id } = req.params

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const event = await prisma.event.findFirst({
        where: { id, userId },
      })

      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }

      const { title, client, type, datetime, location, status, notes } = req.body

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(client && { client }),
          ...(type && { type }),
          ...(datetime && { datetime: new Date(datetime) }),
          ...(location && { location }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
      })

      logger.log('Event updated', { eventId: updatedEvent.id })
      res.json(updatedEvent)
    } catch (error) {
      logger.error('Error updating event', error)
      res.status(500).json({ message: 'Failed to update event' })
    }
  }

  // Delete an event
  async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId
      const { id } = req.params

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const event = await prisma.event.findFirst({
        where: { id, userId },
      })

      if (!event) {
        return res.status(404).json({ message: 'Event not found' })
      }

      await prisma.event.delete({
        where: { id },
      })

      logger.log('Event deleted', { eventId: id })
      res.json({ message: 'Event deleted successfully' })
    } catch (error) {
      logger.error('Error deleting event', error)
      res.status(500).json({ message: 'Failed to delete event' })
    }
  }
}
