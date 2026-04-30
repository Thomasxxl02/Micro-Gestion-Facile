import { describe, it, expect } from "vitest";
import { automationService } from "../automationService";
import { Invoice, InvoiceStatus, AutomationSettings } from "../../types";

describe("automationService", () => {
  describe("checkDueReminders", () => {
    it("should return empty array if autoReminder is disabled", () => {
      const invoices: Invoice[] = [
        { id: "1", dueDate: "2026-04-20", status: InvoiceStatus.SENT } as Invoice
      ];
      const settings: AutomationSettings = { 
        autoReminderEnabled: false, 
        autoReminderDelayDays: 5,
        recurringInvoices: [] 
      };
      
      const result = automationService.checkDueReminders(invoices, settings);
      expect(result).toHaveLength(0);
    });

    it("should return invoices due exactly X days ago", () => {
      // Setup: Mock current date if necessary or use relative dates
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

      const invoices: Invoice[] = [
        { id: "1", dueDate: fiveDaysAgoStr, status: InvoiceStatus.SENT } as Invoice,
        { id: "2", dueDate: "2026-01-01", status: InvoiceStatus.SENT } as Invoice, // Too old
      ];
      const settings: AutomationSettings = { 
        autoReminderEnabled: true, 
        autoReminderDelayDays: 5,
        recurringInvoices: [] 
      };
      
      const result = automationService.checkDueReminders(invoices, settings);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("calculateNextMonthEnd", () => {
    it("should return correct end of next month", () => {
      // 15 Janvier -> 28/29 Février
      const result1 = automationService.calculateNextMonthEnd("2026-01-15");
      expect(result1).toBe("2026-02-28");

      // 31 Mai -> 30 Juin
      const result2 = automationService.calculateNextMonthEnd("2026-05-31");
      expect(result2).toBe("2026-06-30");

      // 31 Décembre -> 31 Janvier N+1
      const result3 = automationService.calculateNextMonthEnd("2026-12-31");
      expect(result3).toBe("2027-01-31");
    });
  });
});
