import { useState, useRef, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Stack,
  LinearProgress,
  Tooltip,
  Box,
  Modal,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Search,
  AutoAwesome,
  Message,
  Visibility,
  Close,
  CheckCircle,
  Cancel,
  Work,
  Business,
  CalendarToday,
  EmojiEvents,
} from "@mui/icons-material";
import type { Resource, Task } from "../services/api";
import { apiService } from "../services/api";
import { createVoiceRecognition } from "../services/voiceRecognition";
import "./home.scss";

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [exactMatches, setExactMatches] = useState<Resource[]>([]);
  const [recommendations, setRecommendations] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignHours, setAssignHours] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [, setAssignError] = useState<string | null>(null);
  const [, setAssignSuccess] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const initVoiceRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = createVoiceRecognition(
        (result) => {
          setSearchQuery(result.transcript);
          if (result.isFinal) {
            setIsListening(false);
            handleSearch(result.transcript);
          }
        },
        (error) => {
          setError(`Voice recognition error: ${error}`);
          setIsListening(false);
        }
      );
    }
  }, []);

  const startListening = () => {
    initVoiceRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        setError("Failed to start voice recognition");
      }
    } else {
      setError("Voice recognition not supported in this browser");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setError("Please enter a search query or use voice command");
      return;
    }

    setLoading(true);
    setError(null);
    setExactMatches([]);
    setRecommendations([]);

    try {
      // Use AI-powered recommendation endpoint for everything
      const response = await apiService.recommendResources(query, 20);

      if (response.recommendations && response.recommendations.length > 0) {
        // Separate exact matches (high score) from recommendations (lower score)
        const exactThreshold = 0.75; // 75% match or higher = exact match

        const exact = response.recommendations.filter(
          (r) => r.match_score && r.match_score >= exactThreshold
        );
        const recommended = response.recommendations.filter(
          (r) => r.match_score && r.match_score < exactThreshold
        );

        setExactMatches(exact);
        setRecommendations(recommended);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(
        "Failed to fetch resources. Check backend connection at https://resource-search-backend.onrender.com"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAllResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAllResources();
      setExactMatches(response.resources);
      setRecommendations([]);
    } catch (err) {
      setError("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  // Teams messaging with task context
  const handleMessage = (resource: Resource, task?: Task) => {
    let message = "";

    if (task) {
      message = `${task.title}\n\n${task.description}`;
    } else {
      message = `Hi ${resource.name}, I'd like to discuss a project opportunity.`;
    }

    const teamsUrl = `msteams://teams.microsoft.com/l/chat/0/0?users=${
      resource.teams_id
    }&message=${encodeURIComponent(message)}`;
    window.open(teamsUrl, "_blank");
  };

  const getWorkloadColor = (
    workload: number
  ): "success" | "warning" | "error" => {
    if (workload < 50) return "success";
    if (workload < 80) return "warning";
    return "error";
  };

  const handleViewProfile = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResource(null);
    setAssignHours("");
    setAssignError(null);
    setAssignSuccess(null);
    setAssignLoading(false);
  };

  const handleAssignWorkload = async () => {
    if (!selectedResource) return;
    const hours = parseFloat(assignHours);

    if (isNaN(hours) || hours <= 0) {
      setAssignError("Please enter a valid number of hours greater than 0");
      setAssignSuccess(null);
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError(null);
      const response = await apiService.updateResourceWorkload(
        selectedResource.id,
        hours
      );

      // Update selected resource and any cards using it
      setSelectedResource(response.resource);
      setExactMatches((prev) =>
        prev.map((r) => (r.id === response.resource.id ? response.resource : r))
      );
      setRecommendations((prev) =>
        prev.map((r) => (r.id === response.resource.id ? response.resource : r))
      );

      setAssignSuccess(response.message || "Workload updated successfully");
    } catch (err) {
      console.error("Assign workload error:", err);
      setAssignError("Failed to update workload. Please try again.");
      setAssignSuccess(null);
    } finally {
      setAssignLoading(false);
    }
  };

  // Helper function to render resource card
  function renderResourceCard(resource: Resource) {
    return (
      <Card elevation={3} className="resource-card">
        <CardContent>
          <Stack direction="row" spacing={2} mb={2}>
            <Avatar className="resource-avatar">
              {resource.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" className="resource-name">
                {resource.name}
              </Typography>
              <Typography variant="body2" className="resource-title">
                {resource.title}
              </Typography>
              <Typography variant="caption" className="resource-dept">
                {resource.department}
              </Typography>
            </Box>
            {resource.match_score && (
              <Box className="match-score">
                <Typography variant="h4" className="score-value">
                  {Math.round(resource.match_score * 100)}%
                </Typography>
                <Typography variant="caption" className="score-label">
                  MATCH
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider className="divider" />

          <Stack spacing={1.5} mb={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" className="label">
                Workload
              </Typography>
              <Box className="workload-container">
                <LinearProgress
                  variant="determinate"
                  value={resource.current_workload}
                  color={getWorkloadColor(resource.current_workload)}
                  className="workload-bar"
                />
                <Typography variant="body2" className="workload-value">
                  {resource.current_workload}%
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" className="label">
                Status
              </Typography>
              <Chip
                label={resource.availability}
                size="small"
                className={`status-chip ${resource.availability}`}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" className="label">
                Experience
              </Typography>
              <Typography variant="body2" className="value">
                {resource.experience_years} years
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" className="label">
                Projects
              </Typography>
              <Typography variant="body2" className="value">
                {resource.projects_completed} completed
              </Typography>
            </Stack>
          </Stack>

          <Divider className="divider" />

          <Box mb={2}>
            <Typography variant="caption" className="section-title">
              SKILLS
            </Typography>
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.5}
              className="skills-container"
            >
              {resource.skills.slice(0, 5).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  className="skill-chip"
                />
              ))}
              {resource.skills.length > 5 && (
                <Chip
                  label={`+${resource.skills.length - 5}`}
                  size="small"
                  className="more-chip"
                />
              )}
            </Stack>
          </Box>

          {resource.recommendation_reason && (
            <Alert
              severity="info"
              icon={<AutoAwesome />}
              className="recommendation-alert"
            >
              <Typography variant="caption" fontWeight={600}>
                AI RECOMMENDATION
              </Typography>
              <List dense disablePadding className="recommendation-list">
                {resource.recommendation_reason
                  .split("•")
                  .filter((r) => r.trim())
                  .map((reason, idx) => (
                    <ListItem key={idx} className="recommendation-list-item">
                      <ListItemIcon className="recommendation-list-icon">
                        <CheckCircle fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={reason.trim()}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
              </List>
            </Alert>
          )}
        </CardContent>

        <CardActions className="card-actions">
          <Button
            variant="outlined"
            size="large"
            startIcon={<Visibility />}
            onClick={() => handleViewProfile(resource)}
            className="view-profile-btn"
          >
            View Profile
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Message />}
            onClick={() => handleMessage(resource)}
            className="message-btn"
          >
            Message
          </Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <>
      <Container maxWidth="lg" className="home-container">
        {/* Search Section */}
        <Paper elevation={3} className="search-section">
          <Stack spacing={3}>
            <Box className="search-input-container">
              <TextField
                fullWidth
                variant="outlined"
                placeholder='Search: "find me a React developer", "React and Python expert", "senior backend engineer"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="search-input"
                InputProps={{
                  startAdornment: <Search className="search-icon" />,
                  endAdornment: (
                    <Tooltip
                      title={
                        isListening ? "Stop listening" : "Start voice command"
                      }
                    >
                      <IconButton
                        onClick={isListening ? stopListening : startListening}
                        className={`voice-btn ${
                          isListening ? "listening" : ""
                        }`}
                      >
                        {isListening ? <MicOff /> : <Mic />}
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Box>

            {isListening && (
              <Alert
                severity="error"
                icon={<Mic />}
                className="listening-alert"
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={16} color="inherit" />
                  <Typography fontWeight={600}>
                    Listening... Speak now
                  </Typography>
                </Stack>
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              className="action-buttons"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => handleSearch()}
                disabled={loading}
                startIcon={<AutoAwesome />}
                className="btn-primary"
              >
                {loading ? "Searching with AI..." : "AI-Powered Search"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={loadAllResources}
                disabled={loading}
                className="btn-secondary"
              >
                Show All
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Results Section */}
        <Box className="results-section">
          {loading ? (
            <Paper elevation={3} className="loading-container">
              <div className="loading-spinner" />
              <Typography variant="h6">
                AI is analyzing and finding the best matches...
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Exact Matches */}
              {exactMatches.length > 0 && (
                <Box mb={4}>
                  <Typography variant="h2" className="results-title">
                    ✅ Perfect Matches ({exactMatches.length})
                  </Typography>
                  <Grid container spacing={3} className="resources-grid">
                    {exactMatches.map((resource) => (
                      <Grid item xs={12} md={6} lg={6} key={resource.id}>
                        {renderResourceCard(resource)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* No Exact Match Message + Recommendations */}
              {exactMatches.length === 0 && recommendations.length > 0 && (
                <Box>
                  <Paper elevation={3} className="no-match-alert">
                    <AutoAwesome className="alert-icon" />
                    <Typography variant="h5">No Exact Match Found</Typography>
                    <Typography variant="body1">
                      We couldn't find developers with the exact skills you
                      requested, but here are some
                      <strong> highly recommended alternatives</strong> based
                      on:
                    </Typography>
                    <Box className="recommendation-factors">
                      <Chip
                        icon={<AutoAwesome />}
                        label="Experience & Seniority"
                        className="factor-chip"
                      />
                      <Chip
                        icon={<AutoAwesome />}
                        label="Similar Tech Stack"
                        className="factor-chip"
                      />
                      <Chip
                        icon={<AutoAwesome />}
                        label="Low Workload"
                        className="factor-chip"
                      />
                      <Chip
                        icon={<AutoAwesome />}
                        label="Proven Track Record"
                        className="factor-chip"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      💡 <strong>AI Insight:</strong> These developers can
                      quickly adapt to new technologies based on their
                      experience and completed projects.
                    </Typography>
                  </Paper>

                  <Typography variant="h2" className="results-title" mt={4}>
                    🤖 AI-Recommended Alternatives ({recommendations.length})
                  </Typography>
                  <Grid container spacing={3} className="resources-grid">
                    {recommendations.map((resource) => (
                      <Grid item xs={12} md={6} lg={4} key={resource.id}>
                        {renderResourceCard(resource)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* No Results At All */}
              {exactMatches.length === 0 &&
                recommendations.length === 0 &&
                !loading &&
                searchQuery && (
                  <Paper elevation={3} className="empty-state">
                    <AutoAwesome className="empty-icon" />
                    <Typography variant="h5">No Developers Found</Typography>
                    <Typography variant="body1">
                      Try searching with different skills or criteria:
                      <br />
                      <strong>"React developer"</strong>,{" "}
                      <strong>"Python and Django expert"</strong>, or{" "}
                      <strong>"senior backend engineer"</strong>
                    </Typography>
                  </Paper>
                )}

              {/* Initial Empty State */}
              {exactMatches.length === 0 &&
                recommendations.length === 0 &&
                !searchQuery && (
                  <Paper elevation={3} className="empty-state">
                    <AutoAwesome className="empty-icon" />
                    <Typography variant="h5">
                      AI-Powered Developer Search
                    </Typography>
                    <Typography variant="body1">
                      Use natural language to find the perfect developer:
                      <br />
                      <strong>"Find me a React developer"</strong>
                      <br />
                      <strong>"React and Python expert"</strong>
                      <br />
                      <strong>"Senior backend engineer"</strong>
                    </Typography>
                  </Paper>
                )}
            </>
          )}
        </Box>
      </Container>

      {/* Profile Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        className="profile-modal"
      >
        <Box className="modal-content">
          {selectedResource && (
            <>
              <Box className="modal-header">
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                  <Avatar className="modal-avatar">
                    {selectedResource.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" className="modal-name">
                      {selectedResource.name}
                    </Typography>
                    <Typography variant="h6" className="modal-title">
                      {selectedResource.title}
                    </Typography>
                    <Typography variant="body2" className="modal-dept">
                      <Business fontSize="small" />{" "}
                      {selectedResource.department}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={handleCloseModal} className="close-btn">
                  <Close />
                </IconButton>
              </Box>

              <Divider />

              <Box className="modal-body">
                {/* Match Score */}
                {selectedResource.match_score && (
                  <Box className="modal-section">
                    <Typography variant="h6" className="section-title">
                      Match Score
                    </Typography>
                    <Box className="match-score-large">
                      <Typography variant="h2" className="score-value">
                        {Math.round(selectedResource.match_score * 100)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Compatibility Match
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Status Information */}
                <Box className="modal-section">
                  <Typography variant="h6" className="section-title">
                    Current Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {selectedResource.availability === "available" ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary="Availability"
                        secondary={selectedResource.availability}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Work color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Current Workload"
                        secondary={
                          <Box className="modal-workload-container">
                            <LinearProgress
                              variant="determinate"
                              value={selectedResource.current_workload}
                              color={getWorkloadColor(
                                selectedResource.current_workload
                              )}
                              className="modal-workload-bar"
                            />
                            <Typography variant="body2">
                              {selectedResource.current_workload}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Experience"
                        secondary={`${selectedResource.experience_years} years`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEvents color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Projects Completed"
                        secondary={selectedResource.projects_completed}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={selectedResource.department}
                      />
                    </ListItem>
                  </List>
                </Box>

                {/* All Skills */}
                <Box className="modal-section">
                  <Typography variant="h6" className="section-title">
                    All Skills ({selectedResource.skills.length})
                  </Typography>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={1}
                    className="skills-grid"
                  >
                    {selectedResource.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                        className="skill-chip-modal"
                      />
                    ))}
                  </Stack>
                </Box>

                {/* AI Recommendation Reasons */}
                {selectedResource.recommendation_reason && (
                  <Box className="modal-section">
                    <Typography variant="h6" className="section-title">
                      Why Recommended
                    </Typography>
                    <List>
                      {selectedResource.recommendation_reason
                        .split("•")
                        .filter((r) => r.trim())
                        .map((reason, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText primary={reason.trim()} />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box className="modal-footer">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
                <Box className="modal-footer-spacer" />
                <Box className="modal-footer-actions">
                  <TextField
                    type="number"
                    size="small"
                    label="Add workload (hours)"
                    value={assignHours}
                    onChange={(e) => setAssignHours(e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    disabled={assignLoading}
                    onClick={handleAssignWorkload}
                  >
                    {assignLoading ? "Assigning..." : "Assign Work"}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Message />}
                    onClick={() => {
                      handleMessage(selectedResource);
                      handleCloseModal();
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}
