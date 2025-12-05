import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getEventDashboard = query({
    args: {eventId: v.id("events")},
    handler: async(ctx,args)=>{
      const user=await ctx.runQuery(internal.users.getCurrentUser);
      if(!user) {
        throw new Error("User not found");
      }

      const event = await ctx.db.get(args.eventId);
      if(!event){
        throw new Error("Event not found");
      }

      //check if user is the organizer
      if(event.organizerId !== user._id) {
        throw new Error("You are not authorized to View this dashboard");
      }

      //Get all registration
      const registrations = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q)=>q.eq("eventId", args.eventId))
        .collect();

      //claculate stats
      const totalRegistrations = registrations.filter(
        (r)=> r.status === "confirmed"
      ).length;

      const checkedInCount =registrations.filter(
        (r) => r.checkedIn && r.status === "confirmed"
      ).length;

      const pandingCount = totalRegistrations-checkedInCount;

      //calculate revenu for paid events
      let totalRevenue =0;
      if(event.ticketType === "paid" && event.ticketPrice) {
        totalRevenue=checkedInCount*event.ticketPrice;
      }

      //calculate check-in rate
      const checkInRate =
        totalRegistrations > 0
            ? Math.round((checkedInCount/totalRegistrations)*100)
            : 0;
        
        // calculate time until event

        const now=Date.now();
        const timeUntilEvent = event.startDate-now;
        const hoursUntilEvent = Math.max(
            0,
            Math.floor(timeUntilEvent/(1000*60*60))
        );

        const today = new Date().setHours(0,0,0,0);
        const startDay =new Date(event.startDate).setHours(0,0,0,0);
        const endDate = new Date(event.endDate).setHours(0,0,0,0);
        const isEventToday = today >=startDay && today <=endDate;

        const isEventPast = event.endDate<now;

        return {
            event,
            stats: {
                totalRegistrations,
                checkedInCount,
                pandingCount,
                capacity: event.capacity,
                checkInRate,
                totalRevenue,
                hoursUntilEvent,
                isEventToday,
                isEventPast,
            },
        };


    }
})