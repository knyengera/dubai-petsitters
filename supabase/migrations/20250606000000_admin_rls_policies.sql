-- Admin write policies for catalog and moderation tables

CREATE POLICY vet_clinics_admin_write ON vet_clinics FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY pets_admin_write ON pets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY blog_posts_admin_write ON blog_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY partner_deals_admin_write ON partner_deals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY lost_pets_admin_write ON lost_pets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY forum_threads_admin_delete ON forum_threads FOR DELETE
  USING (public.is_admin());

CREATE POLICY forum_comments_admin_delete ON forum_comments FOR DELETE
  USING (public.is_admin());

CREATE POLICY adoption_requests_admin_write ON adoption_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY reviews_admin_write ON reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY hosting_bookings_admin_write ON hosting_bookings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY appointments_admin_write ON appointments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
