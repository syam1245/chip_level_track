import { z } from "zod";

const AccessoriesSchema = z
    .object({
        powerAdapter: z.boolean().default(false),
        powerCord: z.boolean().default(false),
        carryCase: z.boolean().default(false),
        battery: z.boolean().default(false),
        others: z.string().nullable().optional(),
    })
    .partial()
    .transform((data) => ({
        powerAdapter: data.powerAdapter ?? false,
        powerCord: data.powerCord ?? false,
        carryCase: data.carryCase ?? false,
        battery: data.battery ?? false,
        others: data.others ?? null,
    }));

export const ExtractionSchema = z
    .object({
        jobNumber: z.string().trim().nullable().optional(),
        customerName: z.string().trim().nullable().optional(),
        customerMobileNo: z.string().trim().nullable().optional(),
        customerEmail: z.string().trim().nullable().optional(),
        item: z.string().trim().nullable().optional(),
        make: z.string().trim().nullable().optional(),
        model: z.string().trim().nullable().optional(),
        serialNumber: z.string().trim().nullable().optional(),
        date: z.string().trim().nullable().optional(),
        accessories: AccessoriesSchema.optional(),
        remarks: z.string().trim().nullable().optional(),
        handwrittenNotes: z.string().trim().nullable().optional(),
    })
    .transform((data) => ({
        jobNumber: data.jobNumber ?? null,
        customerName: data.customerName ?? null,
        customerMobileNo: data.customerMobileNo ?? null,
        customerEmail: data.customerEmail ?? null,
        item: data.item ?? null,
        make: data.make ?? null,
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        date: data.date ?? null,
        accessories: data.accessories,
        remarks: data.remarks ?? null,
        handwrittenNotes: data.handwrittenNotes ?? null,
    }));