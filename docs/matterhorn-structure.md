# Matterhorn Structure Report

This document provides an analysis of the `.matterhorn` directory structure found in the project.

## Overview

The `.matterhorn` directory is located at `fixtures/junie-explorer/matterhorn/.matterhorn/` and contains various files and subdirectories related to project workflows, history processing, and task management.

## Directory Structure

The `.matterhorn` directory has the following main components:

### 1. Session Directories

There are multiple session directories identified by UUIDs with sequence numbers:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0`
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1`
- `fed3cf2f-965e-4f08-9ac9-b3666665ec8c 0`

Each session directory contains:
- A compress history processor file (`.compress_history_processor`)
- Multiple step directories (`step_01`, `step_02`, etc.)
- Step transition files (`.webstorm_swe_next_step`)

### 2. Project Structure Worker Files

Files with `.project_str_worker` extension that appear to contain project structure information:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0.project_str_worker`
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1.project_str_worker`
- `fed3cf2f-965e-4f08-9ac9-b3666665ec8c 0.project_str_worker`

### 3. WebStorm SWE Patch Files

Files with `.webstorm_swe_patch` extension that likely contain code patches:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0.webstorm_swe_patch`
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1.webstorm_swe_patch`

### 4. Events Directory

Contains event logs in JSONL format:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0-events.jsonl`
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1-events.jsonl`
- `fed3cf2f-965e-4f08-9ac9-b3666665ec8c 0-events.jsonl`

### 5. Exit Status File

A file named `exit.status` containing status information.

### 6. Issues Directory

Contains task chains and individual tasks:
- Chain directories: `chain-0daab20c-d2fd-49ed-8d10-fe03d2065eba`, `chain-fed3cf2f-965e-4f08-9ac9-b3666665ec8c`
- Chain JSON files: `chain-0daab20c-d2fd-49ed-8d10-fe03d2065eba.json`, `chain-fed3cf2f-965e-4f08-9ac9-b3666665ec8c.json`
- Task directories with step subdirectories containing step JSON files

### 7. Logs Directory

Contains log files organized by session and step:
- Session log directories: `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0`, `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1`, etc.
- Step log directories: `step_01`, `step_02`, etc.
- Log files in Markdown format (`.log.md`)

### 8. Representations Directory

Contains representation files organized by session and step:
- Session representation directories
- Step representation directories
- Various representation files with different extensions

### 9. Sources Directory

Contains source files organized by session and step:
- Session source directories
- Step source directories
- Various source files with different extensions

### 10. Trajectory Directory

Contains trajectory data in JSONL format:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0.jsonl`
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1.jsonl`
- `fed3cf2f-965e-4f08-9ac9-b3666665ec8c 0.jsonl`

## File Types

The `.matterhorn` directory contains various file types:

1. **JSON Files** (`.json`): Used for task and step definitions
2. **JSONL Files** (`.jsonl`): Used for events and trajectory data
3. **Processor Files**:
   - `.compress_history_processor`: Likely for compressing history data
   - `.void_history_processor`: Likely for processing history data
4. **WebStorm Files**:
   - `.webstorm_swe_next_step`: Transition files between steps
   - `.webstorm_swe_patch`: Patch files for code changes
5. **Project Structure Files** (`.project_str_worker`): Contain project structure information
6. **Log Files** (`.log.md`): Markdown files containing logs
7. **Status Files** (`.status`): Contain status information

## Size Analysis

File sizes vary significantly:
- Small files (< 1KB): Configuration files, status files
- Medium files (1KB - 50KB): Most processor files, step files
- Large files (> 50KB): Some event logs, trajectory files, and history processor files

The largest files are:
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 1-events.jsonl`: 508,306 bytes
- `0daab20c-d2fd-49ed-8d10-fe03d2065eba 0-events.jsonl`: 235,080 bytes
- `step_03.void_history_processor`: 89,585 bytes

## Conclusion

The `.matterhorn` directory appears to be a comprehensive system for tracking project history, managing tasks, and storing logs and representations. The structure suggests a workflow-based approach with multiple steps and sessions, likely used for development and debugging purposes.