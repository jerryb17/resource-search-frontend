import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Alert,
} from "@mui/material";

interface AssignTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  estimatedHours: string;
  setEstimatedHours: (value: string) => void;
  priority: string;
  setPriority: (value: string) => void;
}

export function AssignTaskModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  title,
  setTitle,
  description,
  setDescription,
  estimatedHours,
  setEstimatedHours,
  priority,
  setPriority,
}: AssignTaskModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="profile-modal">
      <Box className="modal-content">
        <Box className="modal-body">
          <Typography variant="h6" className="section-title">
            Assign Work
          </Typography>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Task title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Estimated hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                inputProps={{ min: 1 }}
                fullWidth
              />
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                fullWidth
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </Box>
        <Box className="modal-footer">
          <Button variant="outlined" size="large" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Assigning..." : "Create & Assign Task"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}


