# Google Vertex AI Speech-to-Text Setup Guide

## 🔧 **Service Account Authentication (Recommended)**

Google Vertex AI Speech-to-Text requires **Service Account JSON credentials** rather than simple API keys for proper authentication.

### **Step 1: Create a Service Account**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `rpg-archivist-26e43`
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **"Create Service Account"**
5. Fill in the details:
   - **Name**: `rpg-scribe-transcription`
   - **Description**: `Service account for RPG Scribe live transcription`
6. Click **"Create and Continue"**

### **Step 2: Grant Required Permissions**

Assign these roles to your service account:
- **Speech Client** (for basic Speech-to-Text API access)
- **Cloud Speech Administrator** (for full access if needed)

### **Step 3: Generate JSON Key**

1. Click on your newly created service account
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. Click **"Create"** - the JSON file will download automatically

### **Step 4: Configure RPG Scribe**

#### **Option A: Environment Variables (Recommended)**
1. Copy the entire JSON content from the downloaded file
2. Add to your `.env` file:
```bash
REACT_APP_VERTEX_AI_PROJECT_ID=rpg-archivist-26e43
REACT_APP_VERTEX_AI_API_KEY={"type":"service_account","project_id":"rpg-archivist-26e43",...}
REACT_APP_VERTEX_AI_LOCATION=us-central1
```

#### **Option B: Direct Configuration**
1. In RPG Scribe admin settings, go to **Live Transcription** → **Vertex AI**
2. Paste the entire JSON content into the **"API Key or Service Account JSON"** field
3. Set **Project ID**: `rpg-archivist-26e43`
4. Set **Region**: `us-central1`

## 🔍 **Troubleshooting**

### **"Connection Failed" Error**
- Ensure you're using Service Account JSON, not an API key
- Verify the Speech-to-Text API is enabled in your project
- Check that your service account has the correct permissions

### **"HTTP 401" Authentication Error**
- Double-check the JSON format is valid
- Ensure the service account hasn't been deleted or disabled
- Verify the project ID matches your actual project

### **"HTTP 403" Permission Error**
- Add the **Speech Client** role to your service account
- Enable the **Cloud Speech-to-Text API** in your project
- Check billing is enabled for your project

## 📚 **Additional Resources**

- [Google Cloud Authentication Guide](https://cloud.google.com/docs/authentication/getting-started)
- [Speech-to-Text API Documentation](https://cloud.google.com/speech-to-text/docs)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-using-service-accounts)

## 🔐 **Security Best Practices**

1. **Never commit** service account JSON files to version control
2. Use **environment variables** for production deployments
3. **Rotate keys** regularly (every 90 days recommended)
4. **Limit permissions** to only what's needed for Speech-to-Text
5. **Monitor usage** in Google Cloud Console

---

**Need Help?** Check the [RPG Scribe Documentation](../README.md) or create an issue on GitHub.
