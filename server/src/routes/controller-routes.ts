import express from 'express';
import { createChecklist, getChecklists, deleteChecklist, updateChecklist } from '../controllers/checklist-controller';

const router = express.Router();

router.post('/checklist', createChecklist);
router.get('/checklists/:userId', getChecklists);
router.delete('/checklist/:checklistId', deleteChecklist);
router.put('/checklist/:checklistId', updateChecklist);

export default router;
