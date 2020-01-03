# Changes

## 01/03/2020

- Pass getter to get bound element for custom validation e.g. `const validate = (model, findElement) => errors`.
- Allow binding to inner element in custom registrations e.g. `<input ref={register({ bindTo: 'input' })}/>`.

## 11/30/2019

- Favor new defaults over current model when reinitializing.
- Reinit should allow partials.
- Add ".update()" method to allow for model updates with synchronization and validation like hooks but from root hook.

## 11/29/2019

- Expose "reinit" so that defaults can be set from useEffect and allow all data to resync before render.
- Reinit should force and allow resync even if mounted.

## 11/22/2019

- Fix issue where registrations in custom components may not bind.
- Fix issue where missing model value throws error but does bubble due to missing element.
- Enable option to clean vanity properties not part of original model.
- update setModel for exposed api to cause render.
- ensure new state for renderer.