import { Router } from 'express'
import { uploadTrackMetadata, listTracks, getSignedURL } from '../controllers/tracks.controller'
const router = Router()
router.post('/', uploadTrackMetadata)
router.get('/', listTracks)
router.get('/signed/:filename', getSignedURL)
export default router
