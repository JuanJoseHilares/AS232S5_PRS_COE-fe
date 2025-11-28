
# Social Project: Management of Heritage Assets – Technical Description

## Project Stack

- **Backend**: Java 18 (IntelliJ IDEA, Spring Boot)
- **Frontend**: Angular (latest stable version)
- **Database**: MongoDB (NeonDB)
## Project Purpose

This PRS initiative for the municipality of Lima offers the possibility of managing the municipality's heritage assets, which helps the staff in managing them.
## Setup Instructions (Imperatives)

1. **Clone** the repository:  
   `git clone https://github.com/JuanJoseHilares/AS232S5_PRS_COE-fe.git`  
2. **Navigate** to the main folder:  
   `cd AS232S5_PRS_COE-fe`
3. **Navigate** into backend:  
   `cd AS232S5_PRS_COE-fe/backend`  
4. **Run** Spring Boot app:  
   `./mvnw spring-boot:run`
3. **Navigate** into frontend:  
   `cd AS232S5_PRS_COE-fe/frontend` 
6. **Install** dependencies and **serve** the Angular app:  
   `npm install`  
   `ng run dev`
## How to use the application (Asset Management)

-First, activate the backend section as shown in the instructions (mvnw spring-boot:run).

-Next, run the React project; it will run on port `http://localhost:4200`.

-Log in with your username and password.

-If everything went well, you will see the main project dashboard.
## Repository Structure

```text
/AS232S5_PRS_COE-fe
├── frontend/       # React app
├── backend/       # Java 17 + Spring Boot REST API
├── README.md       # you are here
├── SUPABASE_SETUP.md # Supabase Storage 
                        Configuration for Attachments.
├── VALIDACION_SBN.md # Implementation according 
                        to Peruvian regulations.
```
---
## Contributing (Imperatives & Advice)
- **Fork** this repo.  
- **Create** a feature branch:  
  `git checkout -b feature/your-feature-name`  
- **Implement**, **test**, and **lint** your feature locally.  
- **Open** a Pull Request with a clear summary and description.  
  > You **should** add “Fixes #\<issue-number\>” in your PR if it's related to an open issue.
## Deployment Requirements (Must & Need To)

The following environment variables must be configured for the backend and frontend to function:
- API_URL="Insert the API URL here"
- CORS must be enabled in the Spring configuration for frontend access.
- Frontend dependencies must be installed before execution.
## Best Practices & Tips

- It is recommended to debug the backend and frontend to verify their correct functionality.
- If an error is detected while running the backend or frontend, it is recommended to send an email to the project leader about the problem: juan.hilares@vallegrande.edu.pe
- You must verify if there have been any changes in the repository before uploading changes to the PRS project.
## Questions & Support

If you need help:
- Contact one of the PRS project members to help you with your problem.

- You can contact our project leader using the following link: juan.hilares@vallegrande.edu.pe

- Join our Valle Grande community for more information.
## Thank you for your contributions!
Thank you for trying our project for automating our future
