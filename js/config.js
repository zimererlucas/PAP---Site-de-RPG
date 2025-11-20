const SUPABASE_URL = 'https://rdrbhapthqnpdtqubuwo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcmJoYXB0aHFucGR0cXVidXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTE2MDUsImV4cCI6MjA3NTM4NzYwNX0.QjZOhXNBYU_F5HKjVDRfY6aFNsNSDodX3q4YJbBwM8U';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);