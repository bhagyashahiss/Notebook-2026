# Notebook Token Dashboard

Vercel-ready Next.js app for Google Form based notebook distribution.

## Workflow

1. Form submission webhook creates a `pending` record.
2. System allocates token:
- Jain -> `J-001`, `J-002`...
- Non-Jain -> `N-001`, `N-002`...
3. Token WhatsApp message is sent.
4. On success status moves to `token_sent`.
5. Admin marks payment done -> status becomes `completed` and thank-you WhatsApp is sent.

## Statuses

- `pending`
- `token_sent`
- `completed`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` and WhatsApp credentials.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Push schema to DB:

```bash
npm run prisma:push
```

6. Run app:

```bash
npm run dev
```

## Core APIs

- `POST /api/form-submit`
- `GET /api/submissions`
- `PATCH /api/submissions/:id/complete`
- `GET /api/events` (SSE)

## Google Apps Script webhook sample

```javascript
const WEBHOOK_URL = "https://YOUR_DOMAIN/api/form-submit";
const WEBHOOK_SECRET = "YOUR_SECRET";

function onFormSubmit(e) {
  const values = e.namedValues;

  const payload = {
    Timestamp: values["Timestamp"]?.[0] ?? "",
    "Email Address": values["Email Address"]?.[0] ?? "",
    "First Name": values["First Name"]?.[0] ?? "",
    "Middle Name": values["Middle Name"]?.[0] ?? "",
    "Last Name": values["Last Name"]?.[0] ?? "",
    "WhatsApp Mobile Number": values["WhatsApp Mobile Number"]?.[0] ?? "",
    "Current Standard/Grade": values["Current Standard/Grade"]?.[0] ?? "",
    "Short Address": values["Short Address"]?.[0] ?? "",
    "Upload recent Marksheet (If current year result is not available then please upload previous year result)":
      values["Upload recent Marksheet (If current year result is not available then please upload previous year result)"]?.[0] ?? "",
    "Are you Jain?": values["Are you Jain?"]?.[0] ?? "",
    "Select Number of Dozen": values["Select Number of Dozen"]?.[0] ?? "",
    "Select Number of Dozen 2": values["Select Number of Dozen 2"]?.[0] ?? "",
  };

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": WEBHOOK_SECRET,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
```

## Notes

- Keep message template names aligned with Meta template names:
- `WHATSAPP_TEMPLATE_BOOKING` (default: `notebook_booking_confirmation`)
- `WHATSAPP_TEMPLATE_PAYMENT` (default: `notebook_payment_confirmation`)
- Add auth before production rollout.

## WhatsApp Template Content (Current)

Use the following content when creating WhatsApp approved templates.

### Template 1: Booking Confirmation

Message text:

```text
Hi {{1}},

*Thank you for your confirmation on Notebooks!*

*Booking Confirmation*
- *Token Number:* {{2}}
- *Number of Notebooks Booked:* {{3}}
- *Amount to be Paid:* {{4}}

📅 *Date:* {{5}}
*Time:* {{6}}
*Venue:* {{7}}

Save this number for future event updates
*Contact:* {{8}}
```

Parameter mapping from app:

1. Full Name
2. Token Number
3. Books text (`1 dozen`, `2 dozens`)
4. Amount (`Rs 200`)
5. Event Date
6. Event Time
7. Event Venue
8. Contact text/link

### Template 2: Payment Confirmation

Message text:

```text
Hi {{1}},

*Thank you for your Payment towards the notebooks*

*Token:* {{2}}
*Books:* {{3}}
*Payment Mode:* {{4}}
*Amount:* {{5}}

_Kindly consider this message as a confirmation of the payment received_

*Save this number for future updates.*

- Sambhav Shanti Yuva Group
```

Parameter mapping from app:

1. Full Name
2. Token Number
3. Books text (`1 dozen`, `2 dozens`)
4. Payment Mode (default `CASH`, override in complete API)
5. Amount (`Rs 200`)
