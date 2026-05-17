# Ratings V2 Backfill Strategy

This project now supports event completion with a ratings payload and keeps organizer stats in `OrganizerStats`.

## Recommended Backfill Approach

1. Select historical events where:
   - `Events.isCompleted = true`
   - no record in `EventRatingConfigs` for the event
2. For each event:
   - infer `actualParticipants` from approved registrations
   - choose a default game type (for example `Гра вихідного дня`) when unknown
   - infer outcomes:
     - if old `EventResults` exist, convert placements to outcomes (`FIRST -> WIN`, all other placements -> PARTICIPATED)
     - otherwise assign `PARTICIPATED` to all sides/teams
3. Call the same service path used by admin completion:
   - `POST /ratings/events/:eventId/complete-with-ratings`
4. Verify:
   - `EventRatingConfigs.isApplied = true`
   - `RatingEntries` inserted for player/team/organizer
   - leaderboards include updated totals

## Safety Notes

- Run on staging first.
- Process in batches to avoid lock contention.
- Skip events that already have `EventRatingConfigs`.
- Keep legacy `EventResults` unchanged for auditability.
