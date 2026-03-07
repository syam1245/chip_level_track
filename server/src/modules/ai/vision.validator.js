import { z } from "zod";

export const ExtractionSchema = z.object({
    jobNumber: z.string().nullable(),
    customerName: z.string().nullable(),
    customerMobileNo: z.string().nullable(),
    customerEmail: z.string().nullable(),
    item: z.string().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    serialNumber: z.string().nullable(),
    date: z.string().nullable(),
    accessories: z.object({
        powerAdapter: z.boolean().default(false),
        powerCord: z.boolean().default(false),
        carryCase: z.boolean().default(false),
        battery: z.boolean().default(false),
        others: z.string().nullable(),
    }).optional(),
    remarks: z.string().nullable(),
    handwrittenNotes: z.string().nullable(),
});
