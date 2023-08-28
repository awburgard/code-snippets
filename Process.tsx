import React from 'react'


export const Process: React.FC = () => {
  const [storedAssets, setStoredAssets] = useSessionStorage<Fields[]>('REDACTED', [
    { id: Math.random(), asset: null },
  ]);

  const handleStoredAsset = React.useCallback(
    (asset: Assets, index: number) => {
      setStoredAssets((prevAssets) => {
        const updatedAssets = prevAssets.map((prevAsset, idx) => {
          if (idx === index) {
            return { ...prevAsset, asset };
          } else {
            return prevAsset;
          }
        });

        return updatedAssets;
      });
    },
    [setStoredAssets]
  );

  const handleRemoveField = React.useCallback(
    (id: number) => {
      setStoredAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== id));
    },
    [setStoredAssets]
  );

  const handleAddField = React.useCallback(() => {
    setStoredAssets((prevFields) => [...prevFields, { id: Math.random(), asset: null }]);
  }, [setStoredAssets]);

  return (
    <DynamicInputFields
          handleRemoveField={handleRemoveField}
          inputFields={storedAssets}
          addAsset={handleStoredAsset}
          handleAddField={handleAddField}
        />
  )
}

export const DynamicInputFields: React.FC<Props> = () => {

  const DynamicInputFields = ({ handleRemoveField, inputFields, addAsset, handleAddField }) => {
  const data = useStatsQuery();

  const filterOptions = (options: { name: string; id: string }[], { inputValue }) =>
    matchSorter(options, inputValue, { keys: ['name', 'id'] });

  return (
    <Card>
      <CardHeader title="Select 1 or More Datasets" className={classes.cardHeader} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography>
              You can paste in the ID if you have it handy or search by your asset's name.
            </Typography>
          </Grid>

          <Grid item container spacing={2} xs={12}>
            {inputFields.map((field, index) => (
              <Grid item xs={12}>
                <Autocomplete
                  id="REDACTED"
                  fullWidth
                  options={data.data || []}
                  loading={data.isLoading}
                  filterOptions={filterOptions}
                  getOptionLabel={(option) => `${option.name} - ${option.id}`}
                  onChange={(_event, asset) => {
                    addAsset(asset, index);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dataset Name or ID"
                      data-cy="REDACTED"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: inputFields.length > 1 && (
                          <IconButton onClick={() => handleRemoveField(field.id)} color="primary">
                            <DeleteOutlineRounded />
                          </IconButton>
                        ),
                      }}
                    />
                  )}
                  disableClearable
                  value={inputFields[index].asset}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={handleAddField}
          variant="contained"
          color="secondary"
          data-cy="blind-stats-add-field-btn"
        >
          Add
        </Button>
      </CardActions>
    </Card>
  );
}
