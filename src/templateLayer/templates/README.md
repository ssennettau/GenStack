# PartySmith Templates

There are multiple `template` directories which are used to build PartySmith apps, starting with the `primary` directory. Additional directories like `cssTheme` and `sst` are added on as layers, overwriting the contents of the `primary` when the project is being created.

```
---------------------
| themeCss |  sst   |
| ----------------- |
|      primary      |
---------------------
```

Changes and modifications can be made to each layer to customize it to the particular app, such as adding the app name to the package info.