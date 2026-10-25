import EmptyState from "../common/EmptyState";
import "../../styles/courseDetailing.css";
import { useContent } from "../../hooks/useContent";
import ContentImage from "../common/ContentImage";

function Course() {
    const { items, error, loading } = useContent("courses");
    if (loading) return <EmptyState message="Loading courses..." />;
    if (error) return <EmptyState message={error} />;
    if (items.length === 0) return <EmptyState message="No course details are available yet." />;
    return (
        <section className="course-box" aria-labelledby="courses-heading">
            <div className="course-header">
                <div>
                    <h2 id="courses-heading">Suggested Courses</h2>
                    <p>Courses currently listed for your class.</p>
                </div>
            </div>
            <div className="course-grid">
                {items.map((course) => (
                    <article className="course-card" key={course.id}>
                        {course.image && (!course.image.mimeType || course.image.mimeType.startsWith("image/")) && (
                            <ContentImage
                                className="course-image"
                                image={course.image}
                                contentType="courses"
                                contentId={course.id}
                                alt=""
                            />
                        )}
                        <h3>{course.courseName || course.title}</h3>
                        <p>{course.description || course.details}</p>
                        <p className="suggested-by"><strong>Suggested by: </strong> {course.suggestedBy}</p>
                        {course.image && course.image.mimeType && !course.image.mimeType.startsWith("image/") && (
                            <a href={course.image.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                Open attachment
                            </a>
                        )}
                        {course.courseLink && (
                            <a href={course.courseLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                Learn..
                            </a>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Course;
