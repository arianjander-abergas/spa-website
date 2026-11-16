-- Sample menu, therapists and opening hours. Safe to run more than once.
-- Edit these in the staff admin (or here) once the real details are known.

insert into services (id, slug, name, category, summary, description, duration_min, price_cents, image, sort) values
  ('11111111-0000-4000-8000-000000000001', 'signature-massage', 'Signature Massage', 'Massage',
   'Long, unhurried strokes with warm oil to settle body and mind.',
   'Our most requested treatment. A full-body massage using long, flowing strokes and warm botanical oil, with pressure set to your preference. Ideal if this is your first visit or you simply want to switch off.',
   60, 180000, '/images/massage.jpg', 10),
  ('11111111-0000-4000-8000-000000000002', 'deep-tissue-massage', 'Deep Tissue Massage', 'Massage',
   'Slow, firm pressure that works into tight shoulders, back and legs.',
   'Focused, firm work on the deeper layers of muscle. Your therapist concentrates on the areas you carry tension — typically neck, shoulders and lower back — and finishes with lighter strokes to release.',
   60, 200000, '/images/deep-tissue.jpg', 20),
  ('11111111-0000-4000-8000-000000000003', 'hot-stone-massage', 'Hot Stone Massage', 'Massage',
   'Smooth heated stones melt tension before a full-body massage.',
   'Warm basalt stones are placed along the back and used in the therapist''s hands to ease muscles more deeply than hands alone. Ninety minutes of steady, enveloping warmth.',
   90, 290000, '/images/hot-stone.jpg', 30),
  ('11111111-0000-4000-8000-000000000004', 'aromatherapy-massage', 'Aromatherapy Massage', 'Massage',
   'A gentle massage with an essential-oil blend chosen with you.',
   'You choose from three essential-oil blends — calming, restoring or uplifting — before a light-to-medium pressure massage designed to quiet the nervous system.',
   60, 190000, '/images/aromatherapy.jpg', 40),
  ('11111111-0000-4000-8000-000000000005', 'radiance-facial', 'Radiance Facial', 'Facials',
   'Cleanse, exfoliate, mask and massage for rested, luminous skin.',
   'A classic facial tailored to your skin on the day: double cleanse, gentle exfoliation, a treatment mask, and a face, neck and shoulder massage while it works.',
   60, 220000, '/images/facial.jpg', 50),
  ('11111111-0000-4000-8000-000000000006', 'body-polish', 'Body Polish', 'Body Rituals',
   'A full-body exfoliation followed by rich, warm moisturiser.',
   'A fine mineral scrub smooths the skin from shoulders to feet, followed by a warm rinse and a generous application of body butter. Skin is left soft for days.',
   60, 210000, '/images/body.jpg', 60),
  ('11111111-0000-4000-8000-000000000007', 'foot-ritual', 'Foot Ritual', 'Body Rituals',
   'A warm floral soak, scrub and pressure-point foot massage.',
   'Begins with a warm soak, then a scrub and a slow pressure-point massage of the feet and lower legs. A good choice after travel or a long week on your feet.',
   45, 120000, '/images/foot-ritual.jpg', 70),
  ('11111111-0000-4000-8000-000000000008', 'scalp-and-shoulder-release', 'Scalp & Shoulder Release', 'Body Rituals',
   'Thirty focused minutes on the head, neck and shoulders.',
   'A short treatment for when time is tight. Warm oil is worked through the scalp, followed by focused massage of the neck and shoulders. Can be added to any massage.',
   30, 90000, '/images/scalp.jpg', 80)
on conflict (id) do nothing;

insert into staff (id, name) values
  ('22222222-0000-4000-8000-000000000001', 'Therapist One'),
  ('22222222-0000-4000-8000-000000000002', 'Therapist Two')
on conflict (id) do nothing;

-- Every therapist can perform every treatment to begin with.
insert into staff_services (staff_id, service_id)
select st.id, sv.id from staff st cross join services sv
on conflict do nothing;

insert into opening_hours (weekday, opens, closes, closed) values
  (0, '10:00', '18:00', false),
  (1, '10:00', '20:00', true),
  (2, '10:00', '20:00', false),
  (3, '10:00', '20:00', false),
  (4, '10:00', '20:00', false),
  (5, '10:00', '21:00', false),
  (6, '09:00', '21:00', false)
on conflict (weekday) do nothing;
