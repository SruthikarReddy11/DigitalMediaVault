import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Hidden notes unlock & list
router.post('/hidden/unlock', NoteController.unlockHidden);
router.get('/hidden', NoteController.listHidden);

// Standard notes CRUD & actions
router.get('/', NoteController.list);
router.post('/', NoteController.create);
router.get('/:id', NoteController.getById);
router.put('/:id', NoteController.update);
router.delete('/:id', NoteController.delete);

// Individual note unlock
router.post('/:id/unlock', NoteController.unlockNote);

// Quick toggles
router.patch('/:id/pin', NoteController.togglePin);
router.patch('/:id/archive', NoteController.toggleArchive);
router.patch('/:id/hide', NoteController.toggleHide);

export default router;
