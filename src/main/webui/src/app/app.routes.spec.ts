import { Route } from '@angular/router';

import { routes } from './app.routes';

describe('Teacher and shell routes (T13)', () => {
  function collectPaths(routeList: Route[], parent = ''): string[] {
    const paths: string[] = [];
    for (const route of routeList) {
      if (route.path === undefined || route.path === '**') {
        continue;
      }
      const full = parent ? `${parent}/${route.path}` : route.path;
      paths.push(full);
      if (route.children?.length) {
        paths.push(...collectPaths(route.children, full));
      }
    }
    return paths;
  }

  function pathPatterns(): string[] {
    return collectPaths(routes);
  }

  it('shouldExposeTeacherAreaRoutesUnderTeacherPrefix', () => {
    const paths = pathPatterns();

    expect(paths).toContain('teacher');
    expect(paths).toContain('teacher/courses/new');
    expect(paths).toContain('teacher/courses/:id/edit');
    expect(paths).toContain('teacher/courses/:id/students');
    expect(paths).toContain('teacher/courses/:id/progress');
  });

  it('shouldNotExposeLegacyTeacherUiRoutes', () => {
    const paths = pathPatterns();

    expect(paths).not.toContain('courses/new');
    expect(paths).not.toContain('courses/:id/edit');
    expect(paths).not.toContain('courses/:id/students');
    expect(paths).not.toContain('courses/:id/progress');
  });

  it('shouldKeepStudentStudyRoutesUnderCourses', () => {
    const paths = pathPatterns();

    expect(paths).toContain('courses/:id');
    expect(paths).toContain('courses/:id/lessons/:itemId');
  });

  it('shouldExposeAdminCategoriesRoute', () => {
    const paths = pathPatterns();

    expect(paths).toContain('admin/categories');
  });
});
