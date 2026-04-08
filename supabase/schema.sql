create table draft_room (
  id integer primary key default 1,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Insert the initial empty row
insert into draft_room (id, data) values (1, '{}');

-- Enable RLS but allow public read/write (it's a private family app)
alter table draft_room enable row level security;

create policy "Allow public read" on draft_room for select using (true);
create policy "Allow public write" on draft_room for update using (true);
