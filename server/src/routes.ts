import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from "./lib/prisma"
import dayjs from 'dayjs'
import { request } from 'http'

export async function appRoutes(app: FastifyInstance){
/* MÉTODO HTTP: GET, POST, PUT, PATCH, DELETE */
   app.post('/habits', async(request) => {
      const createHabitBody = z.object({
         title: z.string(),
         weekDays: z.array(
            z.number().min(0).max(6)
         )
      })

      //title, weekDays
      const { title, weekDays } = createHabitBody.parse(request.body)

      const today = dayjs().startOf('day').toDate()

      await prisma.habit.create({
         data: {
            title,
            created_at: today,
            weekDays: {
               create: weekDays.map(weekDay => {
                  return{
                     week_day: weekDay,
                  }
               })
            }
         }
      })
   })

   app.get('/day', async (request) => {
      const getDayParams = z.object({
         date: z.coerce.date()
      })

      const { date } = getDayParams.parse(request.query)
      //localhost:3333/day?date=2022-01-24T00:00:000z

      const parsedDate = dayjs(date).startOf('day')
      const weekDay = dayjs(date).get('day')
      
      const possibleHabits = await prisma.habit.findMany({
         where: {
            created_at: {
               lte: date,
            },
            weekDays: {
               some: {
                  week_day: weekDay,
               }
            }
         }
      })

      const day = await prisma.day.findUnique({
         where:{
            date: parsedDate.toDate(),
         },
         include: {
             dayHabits: true,
         }
      })

      const completedHabits = day?.dayHabits.map(dayHabit => {
         return dayHabit.habit_id
      })

      return {
         possibleHabits,
         completedHabits
      }
   })
}