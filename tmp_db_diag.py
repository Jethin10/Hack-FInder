import sqlite3
from pathlib import Path

db = Path("data") / "hackhunt.db"
con = sqlite3.connect(db)
cur = con.cursor()

print("db_path", db.resolve())
print("active_total", cur.execute("select count(*) from hackathons where is_active=1").fetchone()[0])
print("all_total", cur.execute("select count(*) from hackathons").fetchone()[0])
print(
    "by_source",
    cur.execute(
        "select source_platform,count(*) from hackathons where is_active=1 group by source_platform order by count(*) desc"
    ).fetchall(),
)
print(
    "latest_created_at",
    cur.execute("select max(created_at) from hackathons where is_active=1").fetchone()[0],
)
