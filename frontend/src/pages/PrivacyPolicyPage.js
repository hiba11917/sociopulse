import React from "react";
import { Link } from "react-router-dom";
import "./PrivacyPolicyPage.css";

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-card">
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: April 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            SocioPulse is a student project developed for academic research.
            This application is designed to help users monitor social media
            usage patterns and self-reported wellbeing indicators.
          </p>
        </section>

        <section>
          <h2>2. What data we collect</h2>
          <p>We may collect the following information:</p>
          <ul>
            <li>
              Basic signup details such as full name, email, date of birth,
              gender, and occupation
            </li>
            <li>
              Assessment responses related to social media use and wellbeing
            </li>
            <li>
              Daily check-in data such as mood, screen time, sleep quality, and
              before-bed usage
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How your data is used</h2>
          <p>Your data is used to:</p>
          <ul>
            <li>Generate personalised wellbeing insights inside the app</li>
            <li>Support academic analysis for the final year project</li>
            <li>Evaluate usage trends and overall system effectiveness</li>
          </ul>
        </section>

        <section>
          <h2>4. Research use</h2>
          <p>
            Where possible, data used for academic analysis will be anonymised
            or presented in aggregated form. The purpose is educational and
            research-based, not commercial.
          </p>
        </section>

        <section>
          <h2>5. Data storage</h2>
          <p>
            Data is stored in a secure database used only for this project.
            Reasonable steps are taken to protect the information collected
            through the application.
          </p>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p>
            By signing up, you confirm that you have read this Privacy Policy
            and agree to the collection and use of your data for the purposes
            described above.
          </p>
        </section>

        <section>
          <h2>7. Account deletion</h2>
          <p>
            Users may delete their account from the profile page. When an
            account is deleted, associated project data stored for that user,
            including assessment responses, daily check-ins, and completed
            goals, will also be removed from the application database.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy or the project,
            please contact the project researcher.
          </p>
        </section>

        <div className="privacy-actions">
          <Link to="/signup" className="privacy-back-button">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}