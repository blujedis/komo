# Changes

## 11/30/2019

- Favor new defaults over current model when reinitializing.

## 11/29/2019

- Expose "reinit" so that defaults can be set from useEffect and allow all data to resync before render.
- Reinit should force and allow resync even if mounted.

## 11/22/2019

- Fix issue where registrations in custom components may not bind.
- Fix issue where missing model value throws error but does bubble due to missing element.
- Enable option to clean vanity properties not part of original model.
- update setModel for exposed api to cause render.
- ensure new state for renderer.