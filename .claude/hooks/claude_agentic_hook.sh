#!/bin/bash
# Claude Code Integration Hook for git-agentic
# This script is called by Claude Code hooks to track AI contributions

set -e  # Exit on any error

# Configuration
CLAUDE_AGENT_ID="${CLAUDE_AGENT_ID:-claude}"  # Default to 'claude' agent
GIT_AGENTIC_CMD="${GIT_AGENTIC_CMD:-git-agentic}"  # Command to run git-agentic
ENABLE_TRACING="${ENABLE_TRACING:-true}"  # Enable/disable trace creation
ENABLE_ATTRIBUTION="${ENABLE_ATTRIBUTION:-true}"  # Enable/disable attribution
LOG_LEVEL="${LOG_LEVEL:-info}"  # Log level: debug, info, warn, error

# Log function with level support
log() {
    local level="${1:-info}"
    shift

    case "$LOG_LEVEL" in
        "debug")
            echo "[CLAUDE-AGENTIC:$level] $*" >&2
            ;;
        "info")
            if [ "$level" != "debug" ]; then
                echo "[CLAUDE-AGENTIC] $*" >&2
            fi
            ;;
        "warn")
            if [ "$level" = "warn" ] || [ "$level" = "error" ]; then
                echo "[CLAUDE-AGENTIC:$level] $*" >&2
            fi
            ;;
        "error")
            if [ "$level" = "error" ]; then
                echo "[CLAUDE-AGENTIC:$level] $*" >&2
            fi
            ;;
    esac
}

# Function to process single file edit
process_single_edit() {
    local tool_input="$1"

    # Extract file information
    file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty')
    old_string=$(echo "$tool_input" | jq -r '.old_string // empty')
    new_string=$(echo "$tool_input" | jq -r '.new_string // empty')

    if [ -z "$file_path" ]; then
        log "warn" "No file_path found in Edit tool input"
        return
    fi

    log "info" "Processing single file edit: $file_path"

    # Create trace entry if enabled
    if [ "$ENABLE_TRACING" = "true" ]; then
        create_trace_entry "Edit" "$tool_input"
    fi

    # Create attribution entries if enabled
    if [ "$ENABLE_ATTRIBUTION" = "true" ]; then
        create_attribution_entries "$file_path" "$old_string" "$new_string"
    fi
}

# Function to process multi-file edit
process_multi_edit() {
    local tool_input="$1"

    # MultiEdit can affect multiple files
    # Extract the files array or individual file operations
    files=$(echo "$tool_input" | jq -r '.files // empty')

    if [ -n "$files" ] && [ "$files" != "null" ]; then
        # Process each file in the files array
        echo "$files" | jq -c '.[]' | while read -r file_data; do
            file_path=$(echo "$file_data" | jq -r '.file_path // .path // empty')
            old_string=$(echo "$file_data" | jq -r '.old_string // empty')
            new_string=$(echo "$file_data" | jq -r '.new_string // empty')

            if [ -n "$file_path" ]; then
                log "info" "Processing multi-edit file: $file_path"
                create_attribution_entries "$file_path" "$old_string" "$new_string"
            fi
        done
    else
        log "warn" "Could not parse MultiEdit files structure"
    fi

    # Create trace entry for the multi-edit operation
    if [ "$ENABLE_TRACING" = "true" ]; then
        create_trace_entry "MultiEdit" "$tool_input"
    fi
}

# Function to process file write operations
process_file_write() {
    local tool_input="$1"

    # Extract file information
    file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty')
    content=$(echo "$tool_input" | jq -r '.content // empty')

    if [ -z "$file_path" ]; then
        log "warn" "No file_path found in Write tool input"
        return
    fi

    log "info" "Processing file write: $file_path"

    # Create trace entry if enabled
    if [ "$ENABLE_TRACING" = "true" ]; then
        create_trace_entry "Write" "$tool_input"
    fi

    # For file writes, attribute all lines in the file (since it's newly created/modified)
    if [ "$ENABLE_ATTRIBUTION" = "true" ] && [ -f "$file_path" ] && [ -n "$content" ]; then
        total_lines=$(wc -l < "$file_path")
        if [ "$total_lines" -gt 0 ]; then
            log "info" "Attributing all $total_lines lines in new file $file_path"
            for ((line=1; line<=total_lines; line++)); do
                "$GIT_AGENTIC_CMD" attr "$file_path" "$line" ai --agent="$CLAUDE_AGENT_ID" 2>/dev/null || true
            done
        fi
    fi
}

# Function to process bash commands
process_bash_command() {
    local tool_input="$1"

    command=$(echo "$tool_input" | jq -r '.command // empty')
    description=$(echo "$tool_input" | jq -r '.description // empty')

    if [ -z "$command" ]; then
        log "warn" "No command found in Bash tool input"
        return
    fi

    log "info" "Processing bash command: ${command:0:50}..."

    # Create trace entry if enabled
    if [ "$ENABLE_TRACING" = "true" ]; then
        create_trace_entry "Bash" "$tool_input"
    fi
}

# Function to create a trace entry
create_trace_entry() {
    local tool_name="$1"
    local tool_input="$2"

    # Create a simple trace entry
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
    tool_args="$(echo "$tool_input" | jq -c .)"
    trace_data="[{\"type\": \"tool_call\", \"tool\": \"$tool_name\", \"args\": $tool_args, \"timestamp\": \"$timestamp\"}]"

    log "debug" "Creating trace entry for $tool_name"

    # Use git-agentic to store the trace (fixed: pass JSON as single argument)
    if "$GIT_AGENTIC_CMD" store "$trace_data" 2>/dev/null; then
        log "debug" "Successfully created trace entry"
    else
        log "warn" "Failed to create trace entry"
    fi
}

# Function to create attribution entries for modified lines
create_attribution_entries() {
    local file_path="$1"
    local old_string="$2"
    local new_string="$3"

    # Skip if file doesn't exist
    if [ ! -f "$file_path" ]; then
        log "warn" "File $file_path does not exist"
        return
    fi

    # If we have both old and new strings, try to find the changed lines more precisely
    if [ -n "$old_string" ] && [ -n "$new_string" ]; then
        find_changed_lines "$file_path" "$old_string" "$new_string"
    elif [ -n "$new_string" ]; then
        # For new content without old content, attribute based on content matching
        find_new_content_lines "$file_path" "$new_string"
    else
        log "warn" "Cannot determine line attribution without content information"
    fi
}

# Function to find lines that contain new content
find_new_content_lines() {
    local file_path="$1"
    local new_content="$2"

    log "debug" "Finding lines with new content in $file_path"

    # Escape special regex characters in new_content for grep
    escaped_content=$(echo "$new_content" | sed 's/[[.*^$()+?{|]/\\&/g' | tr '\n' '\\n')

    # Find lines containing parts of the new content
    line_numbers=$(grep -n "$escaped_content" "$file_path" 2>/dev/null | cut -d: -f1 || true)

    if [ -n "$line_numbers" ]; then
        log "debug" "Found content matches on lines: $line_numbers"
        echo "$line_numbers" | while read -r line_num; do
            if [ -n "$line_num" ] && [ "$line_num" -gt 0 ]; then
                "$GIT_AGENTIC_CMD" attr "$file_path" "$line_num" ai --agent="$CLAUDE_AGENT_ID" 2>/dev/null || true
            fi
        done
    else
        # Fallback: attribute last few lines if content matching fails
        total_lines=$(wc -l < "$file_path")
        if [ "$total_lines" -gt 0 ]; then
            lines_to_attribute=3  # Attribute last 3 lines as fallback
            start_line=$((total_lines - lines_to_attribute + 1))
            [ "$start_line" -lt 1 ] && start_line=1

            log "debug" "Fallback: Attributing lines $start_line-$total_lines"
            for ((line=start_line; line<=total_lines; line++)); do
                "$GIT_AGENTIC_CMD" attr "$file_path" "$line" ai --agent="$CLAUDE_AGENT_ID" 2>/dev/null || true
            done
        fi
    fi
}

# Function to find changed lines using diff-like approach
find_changed_lines() {
    local file_path="$1"
    local old_string="$2"
    local new_string="$3"

    log "debug" "Analyzing changes in $file_path"

    # Create temporary files for diff
    temp_old=$(mktemp)
    temp_new=$(mktemp)

    echo "$old_string" > "$temp_old"
    echo "$new_string" > "$temp_new"

    # Use diff to find changes, but this is complex for multi-line changes
    # For now, we'll use a simpler approach and attribute based on new content
    find_new_content_lines "$file_path" "$new_string"

    # Clean up temp files
    rm -f "$temp_old" "$temp_new"
}

# Check if git-agentic is available
if ! command -v "$GIT_AGENTIC_CMD" &> /dev/null; then
    log "error" "git-agentic command not found. Please ensure it's installed and in PATH."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir &> /dev/null; then
    log "warn" "Not in a git repository. Skipping attribution."
    exit 0
fi

# Read JSON input from Claude Code
input_data=$(cat)
log "debug" "Received hook data: ${input_data:0:200}..."

# Parse tool information
tool_name=$(echo "$input_data" | jq -r '.tool_name // empty')
tool_input=$(echo "$input_data" | jq -r '.tool_input // empty')

if [ -z "$tool_name" ] || [ -z "$tool_input" ]; then
    log "warn" "Missing tool_name or tool_input in hook data"
    exit 0
fi

log "info" "Processing $tool_name tool execution"

# Process different tool types
case "$tool_name" in
    "Edit")
        process_single_edit "$tool_input"
        ;;
    "MultiEdit")
        process_multi_edit "$tool_input"
        ;;
    "Write")
        process_file_write "$tool_input"
        ;;
    "Bash")
        process_bash_command "$tool_input"
        ;;
    *)
        log "info" "Tool $tool_name not tracked (only Edit/MultiEdit/Write/Bash are supported)"
        ;;
esac

log "info" "Hook processing complete"

# Main execution
log "debug" "Configuration: agent=$CLAUDE_AGENT_ID, tracing=$ENABLE_TRACING, attribution=$ENABLE_ATTRIBUTION, log_level=$LOG_LEVEL"
log "info" "Claude Code hook started for $tool_name"
