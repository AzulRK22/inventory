"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";

export default function InventoryFeedback({
  pendingDeleteItem,
  onCancelDelete,
  onConfirmDelete,
  inventoryStatus,
  inventoryError,
}) {
  return (
    <>
      <Dialog open={Boolean(pendingDeleteItem)} onClose={onCancelDelete}>
        <DialogTitle>Delete product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingDeleteItem
              ? `This will permanently remove "${pendingDeleteItem.name}" from inventory and add a delete movement to the history.`
              : "This will permanently remove the product from inventory."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onCancelDelete}>
            Cancel
          </Button>
          <Button variant="contained" color="secondary" onClick={onConfirmDelete}>
            Delete product
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(inventoryStatus)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          {inventoryStatus}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(inventoryError)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {inventoryError}
        </Alert>
      </Snackbar>
    </>
  );
}
