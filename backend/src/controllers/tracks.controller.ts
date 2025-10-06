import { Request, Response } from 'express'
import { supabaseAdmin } from '../models/db'

export async function uploadTrackMetadata(req: Request, res: Response) {
  const { title, filename, user_id, duration } = req.body
  if (!title || !filename || !user_id) return res.status(400).json({ error: 'missing' })
  const { data, error } = await supabaseAdmin.from('tracks').insert({
    title,
    filename,
    user_id,
    duration
  })
  if (error) return res.status(500).json({ error })
  return res.status(201).json({ data })
}

export async function listTracks(_req: Request, res: Response) {
  const { data, error } = await supabaseAdmin.from('tracks').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  return res.json({ data })
}

export async function getSignedURL(req: Request, res: Response) {
  const { filename } = req.params
  const { data, error } = await supabaseAdmin.storage.from('audio-files').createSignedUrl(filename, 60 * 60)
  if (error) return res.status(500).json({ error })
  return res.json(data)
}
