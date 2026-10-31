package ecommerce.admin.service;

import ecommerce.admin.dto.request.EmbeddingRequests;
import ecommerce.admin.dto.response.JobProgressResponse;

public interface EmbeddingJobService {

    JobProgressResponse startBatchSync(EmbeddingRequests.BatchSyncRequest request);

    JobProgressResponse startReconcile();

    JobProgressResponse getJobProgress(String jobId);
}
