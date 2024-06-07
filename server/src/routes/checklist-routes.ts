import express from 'express';
import { createChecklist, getChecklist, deleteChecklist, updateChecklist } from '../controllers/checklist-controller';

const router = express.Router();

router.post('/createChecklist', createChecklist);
router.get('/getChecklist', getChecklist);
router.delete('/deleteChecklist/:checklistId', deleteChecklist);
router.put('/updateChecklist/:checklistId', updateChecklist);

export default router;
