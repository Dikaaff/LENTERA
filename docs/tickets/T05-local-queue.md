# T05 — Local queue, hook, emergency export

Status: done
Blocked by: T02

## Outcome

`src/modules/queue` owns persistence. Reports are written locally first, keyed
by a client UUID. A React hook reports held count. Export downloads the full
queue as JSON.

## Done when

- Reload while offline keeps every row.
- Re-saving the same id updates instead of duplicating.
- Export works with no network and no Firebase config.
