import { describe, it, expect, vi } from 'vitest';
import { buildPatchPayload } from './ProjectModal';
import { DeleteConfirmationHandler } from './DeleteConfirmModal';
import { Project } from '../types';

describe('Project Form & Actions (Vitest)', () => {
  const baseProject: Project = {
    id: 1,
    title: 'Client Portal Redesign',
    status: 'active',
    deadline: '2026-12-15',
    budget: 120000,
    spentAmount: 45000,
    createdAt: '2026-11-01T10:00:00Z',
  };

  describe('buildPatchPayload', () => {
    it('builds a PATCH payload with ONLY changed fields', () => {
      // 1. Only title changed
      const titleOnly = buildPatchPayload(baseProject, {
        title: 'New Portal Name',
        status: 'active',
        deadline: '2026-12-15',
        budget: '120000',
        spentAmount: '45000',
      });
      expect(titleOnly).toEqual({ title: 'New Portal Name' });
      expect(titleOnly.status).toBeUndefined();
      expect(titleOnly.deadline).toBeUndefined();
      expect(titleOnly.budget).toBeUndefined();
      expect(titleOnly.spentAmount).toBeUndefined();

      // 2. Only budget changed
      const budgetOnly = buildPatchPayload(baseProject, {
        title: 'Client Portal Redesign',
        status: 'active',
        deadline: '2026-12-15',
        budget: '150000',
        spentAmount: '45000',
      });
      expect(budgetOnly).toEqual({ budget: 150000 });

      // 3. Only status changed
      const statusOnly = buildPatchPayload(baseProject, {
        title: 'Client Portal Redesign',
        status: 'completed',
        deadline: '2026-12-15',
        budget: '120000',
        spentAmount: '45000',
      });
      expect(statusOnly).toEqual({ status: 'completed' });

      // 4. Multiple fields changed
      const multiple = buildPatchPayload(baseProject, {
        title: 'Brand Refresh 2026',
        status: 'on_hold',
        deadline: '2026-12-15',
        budget: '135000',
        spentAmount: '50000',
      });
      expect(multiple).toEqual({
        title: 'Brand Refresh 2026',
        status: 'on_hold',
        budget: 135000,
        spentAmount: 50000,
      });

      // 5. No fields changed -> empty object
      const noChanges = buildPatchPayload(baseProject, {
        title: 'Client Portal Redesign',
        status: 'active',
        deadline: '2026-12-15',
        budget: '120000',
        spentAmount: '45000',
      });
      expect(noChanges).toEqual({});
    });

    it('sends empty deadline as null', () => {
      // Existing project with a deadline -> user clears deadline input to ""
      const payload = buildPatchPayload(baseProject, {
        title: 'Client Portal Redesign',
        status: 'active',
        deadline: '',
        budget: '120000',
        spentAmount: '45000',
      });

      expect(payload).toEqual({ deadline: null });
      expect(payload.deadline).toBeNull();
    });

    it('does not send deadline if it was already null and remained empty', () => {
      const projectWithoutDeadline: Project = {
        ...baseProject,
        deadline: null,
      };

      const payload = buildPatchPayload(projectWithoutDeadline, {
        title: 'Client Portal Redesign',
        status: 'active',
        deadline: '',
        budget: '120000',
        spentAmount: '45000',
      });

      expect(payload).toEqual({});
      expect(payload.deadline).toBeUndefined();
    });

    it('sends new deadline string when updating from null to a date', () => {
      const projectWithoutDeadline: Project = {
        ...baseProject,
        deadline: null,
      };

      const payload = buildPatchPayload(projectWithoutDeadline, {
        title: 'Client Portal Redesign',
        status: 'active',
        deadline: '2026-12-31',
        budget: '120000',
        spentAmount: '45000',
      });

      expect(payload).toEqual({ deadline: '2026-12-31' });
    });
  });

  describe('Delete confirmation dialog workflow', () => {
    it('calls delete ONLY after confirmation', async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const handler = new DeleteConfirmationHandler(deleteMock);

      // 1. User cancels dialog (confirmed = false)
      const cancelledResult = await handler.handleAction(false, baseProject);
      expect(cancelledResult).toBe(false);
      expect(deleteMock).not.toHaveBeenCalled();

      // 2. User confirms dialog (confirmed = true)
      const confirmedResult = await handler.handleAction(true, baseProject);
      expect(confirmedResult).toBe(true);
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(deleteMock).toHaveBeenCalledWith(baseProject);
    });

    it('guards against rapid double-clicks (only one delete request executed)', async () => {
      let resolveDelete: () => void = () => {};
      const slowDeletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      const deleteMock = vi.fn().mockImplementation(() => slowDeletePromise);
      const handler = new DeleteConfirmationHandler(deleteMock);

      // First click: triggers delete
      const firstClickPromise = handler.handleAction(true, baseProject);

      // Second immediate click while first is still pending
      const secondClickResult = await handler.handleAction(true, baseProject);

      // The second click was ignored because handler is busy
      expect(secondClickResult).toBe(false);
      expect(deleteMock).toHaveBeenCalledTimes(1);

      // Resolve first delete
      resolveDelete();
      const firstClickResult = await firstClickPromise;
      expect(firstClickResult).toBe(true);
    });
  });
});
