# Cadence

Cadence is a course platform where Learners buy courses from instructors. This glossary fixes the words we use for every concept, so the UI, emails and code tell the same story.

## Language

### People

**Learner**:
A person who has bought, or is taking, a course on Cadence.
_Avoid_: Student, Customer, Buyer, user

### Team Licences

**Team Licence**:
A Purchase that buys several Seats on a course for a team.
_Avoid_: Team purchase, bulk purchase

**Seat**:
One place on a Team Licence, which a single Learner can take.
_Avoid_: Coupon, code

**Claimed**:
Describes a Seat that a Learner has taken. A Learner on a Claimed Seat cannot raise a Refund Request.
_Avoid_: Redeemed, used

### Refunds

**Refund Request**:
A Learner's ask to get their money back for a Purchase. Its status is Requested, then Approved or Declined. A Purchase can have at most one, so a Declined request is final. The Learner's action is labelled "Request refund".
_Avoid_: Cancellation, cancel my purchase, Reversal, Chargeback, open refund, pending refund

**Refund Reason**:
The Learner's own words, required when they raise a Refund Request, explaining why they want their money back.
_Avoid_: Note, comment, what went wrong

**Refund**:
The money returned to the Learner when a Refund Request is Approved. It is always the full Refund Amount.
_Avoid_: Reversal, partial refund

**Refund Amount**:
The amount the Learner actually paid for the Purchase. It is fixed when the Refund Request is raised.
_Avoid_: List price, refundable amount

**Refund Eligibility**:
Whether a Purchase may have a Refund Request raised against it. It is judged only at the moment the request is raised. A Purchase is eligible only if it is inside the Refund Window, the Learner has watched less than two hours and completed less than half the lessons, it is not a Team Licence with any Seat Claimed, the Learner does not hold the course through a Claimed Seat, and it has never had a Refund Request.

**Refund Window**:
The fourteen calendar days after a Purchase, including the fourteenth day, in which a Refund Request may be raised.
_Avoid_: Cancellation window, cancel window

**Requested**:
The status of a Refund Request that is waiting for an Admin's decision. The Learner keeps access to the course meanwhile.
_Avoid_: Open, pending, waiting on us

**Approved**:
The status of a Refund Request an Admin has accepted. The Learner gets a Refund and loses access to the course.

**Declined**:
The status of a Refund Request an Admin has turned down, with a Decline Reason. No money is returned.
_Avoid_: Rejected, denied

**Decline Reason**:
The Admin's explanation, required when declining a Refund Request, which is shown to the Learner.
_Avoid_: Rejection reason

**Refunded Purchase**:
A Purchase whose Refund Request was Approved. It no longer gives access to the course.
_Avoid_: Cancelled purchase, reversed purchase

**Chargeback**:
A payment dispute the cardholder raises with their bank, which pulls the money back without going through Cadence. It is not a Refund Request, and Cadence does not model it today.
_Avoid_: Using it for any learner-initiated request
